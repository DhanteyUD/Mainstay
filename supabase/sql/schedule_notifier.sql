select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/notifier', 'notifier_url');
select vault.create_secret('<SAME_VALUE_AS_CRON_SECRET_FUNCTION_SECRET>', 'notifier_cron_secret');

select cron.schedule(
  'mainstay-notifier',
  '* * * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'notifier_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notifier_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 50000
  );
  $$
);
