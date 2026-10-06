-- Telegram alerts for limit orders: link table, outbox, triggers and helpers.
-- All objects are server-side only: RLS is enabled with no policies, so only
-- the service role (Edge Functions) can read or write them.

alter table public."limitOrders" add column if not exists notified_at timestamptz;

-- One row per linked wallet. link_token_hash is a sha256 of the one-time
-- /start token; chat_id stays null until the user completes the Telegram step.
create table if not exists public.telegram_links (
  wallet_address   text primary key,
  chat_id          bigint,
  username         text,
  link_token_hash  text,
  link_expires_at  timestamptz,
  link_requested_at timestamptz not null default now(),
  linked_at        timestamptz,
  muted            boolean not null default false
);
create index if not exists telegram_links_token_idx on public.telegram_links (link_token_hash) where link_token_hash is not null;
create index if not exists telegram_links_chat_idx on public.telegram_links (chat_id) where chat_id is not null;
alter table public.telegram_links enable row level security;

create table if not exists public.notification_outbox (
  id           bigint generated always as identity primary key,
  wallet_address text not null,
  order_id     text not null,
  event        text not null check (event in ('target_hit', 'executed', 'failed')),
  payload      jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  sent_at      timestamptz,
  attempts     int not null default 0,
  locked_until timestamptz,
  unique (order_id, event)
);
create index if not exists notification_outbox_pending_idx on public.notification_outbox (created_at) where sent_at is null;
alter table public.notification_outbox enable row level security;

-- executed / failed alerts come straight from the order row, so nothing in the
-- browser can inject message content.
create or replace function public.enqueue_order_status_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('executed', 'failed') and new.status is distinct from old.status then
    insert into public.notification_outbox (wallet_address, order_id, event, payload)
    values (
      new.wallet_address,
      new.id,
      new.status,
      jsonb_build_object(
        'inSymbol', new.input_token_symbol,
        'outSymbol', new.output_token_symbol,
        'amount', new.input_amount,
        'targetPrice', new.target_price,
        'direction', new.direction,
        'explorerUrl', new.explorer_url,
        'error', new.error
      )
    )
    on conflict (order_id, event) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists limit_orders_status_notify on public."limitOrders";
create trigger limit_orders_status_notify
  after update of status on public."limitOrders"
  for each row execute function public.enqueue_order_status_notification();

-- Atomically claims a batch of due outbox rows so overlapping cron runs never
-- send the same message twice. Rows are retried up to 5 times.
create or replace function public.claim_outbox(batch int default 50)
returns setof public.notification_outbox
language sql
security definer
set search_path = public
as $$
  update public.notification_outbox o
     set attempts = o.attempts + 1,
         locked_until = now() + interval '2 minutes'
   where o.id in (
     select id from public.notification_outbox
      where sent_at is null
        and attempts < 5
        and (locked_until is null or locked_until < now())
      order by created_at
      limit batch
      for update skip locked
   )
  returning o.*;
$$;

-- Only pending mainnet orders whose owner has an active Telegram link, so the
-- price watcher never fetches prices nobody is waiting on.
create or replace function public.pending_orders_to_watch(max_rows int default 1000)
returns table (
  id text,
  wallet_address text,
  direction text,
  input_token_mint text,
  input_token_symbol text,
  output_token_symbol text,
  input_amount text,
  target_price numeric
)
language sql
security definer
set search_path = public
as $$
  select o.id, o.wallet_address, o.direction, o.input_token_mint,
         o.input_token_symbol, o.output_token_symbol, o.input_amount::text, o.target_price::numeric
    from public."limitOrders" o
    join public.telegram_links t on t.wallet_address = o.wallet_address
   where o.status = 'pending'
     and o.notified_at is null
     and t.chat_id is not null
     and t.muted = false
   limit max_rows;
$$;

revoke all on function public.claim_outbox(int) from public, anon, authenticated;
revoke all on function public.pending_orders_to_watch(int) from public, anon, authenticated;
revoke all on function public.enqueue_order_status_notification() from public, anon, authenticated;
grant execute on function public.claim_outbox(int) to service_role;
grant execute on function public.pending_orders_to_watch(int) to service_role;
