/*
  # Enable pg_cron and pg_net, schedule CEO analysis

  1. Extensions
    - Enable pg_cron for scheduled job execution
    - Enable pg_net for async HTTP calls from within PostgreSQL

  2. Scheduled Jobs
    - CEO analysis at 12:00 Berlin time (10:00 UTC / 11:00 UTC depending on DST)
    - CEO analysis at 18:00 Berlin time (16:00 UTC / 17:00 UTC depending on DST)
    - Both jobs call the scheduled-ceo-analysis edge function using pg_net

  3. Notes
    - pg_cron runs in UTC; we use fixed UTC offsets for Berlin time
    - The edge function uses Haiku model for cost efficiency
    - verify_jwt is false on the edge function so pg_net can call it without auth
*/

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'ceo-analysis-noon',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-ceo-analysis',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'ceo-analysis-evening',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/scheduled-ceo-analysis',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
    ),
    body := '{}'::jsonb
  );
  $$
);