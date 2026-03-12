/*
  # Add anon role policies for token_usage_log and ceo_analysis_cache

  The app uses the anon key for frontend queries, so anon SELECT and INSERT
  policies are needed to match the existing pattern used by ai_tasks_log.

  1. Security
    - Allow anon SELECT on token_usage_log (for dashboard display)
    - Allow anon INSERT on token_usage_log (edge function logs via service role, but fallback)
    - Allow anon SELECT on ceo_analysis_cache (for loading cached CEO insights)
    - Allow anon INSERT on ceo_analysis_cache (for manual CEO analysis saves)
*/

CREATE POLICY "Allow anon select on token_usage_log"
  ON token_usage_log
  FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on token_usage_log"
  ON token_usage_log
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon select on ceo_analysis_cache"
  ON ceo_analysis_cache
  FOR SELECT
  TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on ceo_analysis_cache"
  ON ceo_analysis_cache
  FOR INSERT
  TO anon
  WITH CHECK (true);