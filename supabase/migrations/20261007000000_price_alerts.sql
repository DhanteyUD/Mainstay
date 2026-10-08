-- Telegram price alerts for watched tokens. Server-side only (RLS on, no
-- policies): the browser reaches this table through the price-alerts function.

create table if not exists public.price_alerts (
  id            uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  token_mint    text not null,
  token_symbol  text not null,
  direction     text not null check (direction in ('above', 'below')),
  target_price  numeric not null check (target_price > 0),
  created_at    timestamptz not null default now(),
  triggered_at  timestamptz
);
create index if not exists price_alerts_wallet_idx on public.price_alerts (wallet_address, created_at desc);
create index if not exists price_alerts_active_idx on public.price_alerts (wallet_address) where triggered_at is null;
alter table public.price_alerts enable row level security;

-- The outbox now carries price alerts too (order_id holds the alert id).
alter table public.notification_outbox drop constraint if exists notification_outbox_event_check;
alter table public.notification_outbox add constraint notification_outbox_event_check
  check (event in ('target_hit', 'executed', 'failed', 'price_alert'));

-- Active alerts of wallets with a live, unmuted Telegram link.
create or replace function public.active_price_alerts_to_watch(max_rows int default 1000)
returns table (
  id uuid,
  wallet_address text,
  token_mint text,
  token_symbol text,
  direction text,
  target_price numeric
)
language sql
security definer
set search_path = public
as $$
  select a.id, a.wallet_address, a.token_mint, a.token_symbol, a.direction, a.target_price
    from public.price_alerts a
    join public.telegram_links t on t.wallet_address = a.wallet_address
   where a.triggered_at is null
     and t.chat_id is not null
     and t.muted = false
   limit max_rows;
$$;

revoke all on function public.active_price_alerts_to_watch(int) from public, anon, authenticated;
grant execute on function public.active_price_alerts_to_watch(int) to service_role;
