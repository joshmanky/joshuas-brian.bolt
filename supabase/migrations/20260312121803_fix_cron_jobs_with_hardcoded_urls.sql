/*
  # Fix cron jobs with project-specific URLs

  The previous migration used current_setting() which returns NULL.
  This migration re-creates the jobs with the actual Supabase project URL and anon key.

  1. Changes
    - Removed old cron jobs that used NULL settings
    - Created new jobs with hardcoded project URL
    - Schedule: 10:00 UTC (12:00 Berlin CET) and 16:00 UTC (18:00 Berlin CET)
*/

SELECT cron.schedule(
  'ceo-analysis-noon',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jhwgdzkvsnwwpqdarpzb.supabase.co/functions/v1/scheduled-ceo-analysis'::text,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impod2dkemt2c253d3BxZGFycHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDgwMTAsImV4cCI6MjA4ODU4NDAxMH0.lH9DWwxjpDEG38Z4YhLaim20Yf2sVq0ovWMMo-aKHqs"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

SELECT cron.schedule(
  'ceo-analysis-evening',
  '0 16 * * *',
  $$
  SELECT net.http_post(
    url := 'https://jhwgdzkvsnwwpqdarpzb.supabase.co/functions/v1/scheduled-ceo-analysis'::text,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impod2dkemt2c253d3BxZGFycHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMDgwMTAsImV4cCI6MjA4ODU4NDAxMH0.lH9DWwxjpDEG38Z4YhLaim20Yf2sVq0ovWMMo-aKHqs"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);