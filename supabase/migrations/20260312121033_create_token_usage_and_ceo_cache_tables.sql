/*
  # Token Usage Tracking & CEO Analysis Cache

  1. New Tables
    - `token_usage_log`
      - `id` (uuid, primary key)
      - `agent_name` (text) - which agent made the call
      - `model` (text) - which Claude model was used
      - `input_tokens` (integer) - tokens consumed by the prompt
      - `output_tokens` (integer) - tokens in the response
      - `estimated_cost` (numeric) - cost estimate in USD
      - `task_type` (text) - type of task performed
      - `created_at` (timestamptz) - when the call was made
    - `ceo_analysis_cache`
      - `id` (uuid, primary key)
      - `performance_summary` (text) - CEO performance analysis text
      - `agent_optimizations` (jsonb) - array of agent optimization suggestions
      - `content_priorities` (jsonb) - array of content priority strings
      - `source` (text) - 'scheduled' or 'manual'
      - `model_used` (text) - which model generated this analysis
      - `created_at` (timestamptz) - when the analysis was generated

  2. Security
    - Enable RLS on both tables
    - Allow service role full access (edge functions use service role key)
    - Allow authenticated reads for dashboard display
*/

CREATE TABLE IF NOT EXISTS token_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name text NOT NULL DEFAULT 'System',
  model text NOT NULL DEFAULT '',
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost numeric(10, 6) NOT NULL DEFAULT 0,
  task_type text NOT NULL DEFAULT 'claude_call',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE token_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read token usage"
  ON token_usage_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert token usage"
  ON token_usage_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS ceo_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  performance_summary text NOT NULL DEFAULT '',
  agent_optimizations jsonb NOT NULL DEFAULT '[]'::jsonb,
  content_priorities jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'manual',
  model_used text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ceo_analysis_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read CEO cache"
  ON ceo_analysis_cache
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can insert CEO cache"
  ON ceo_analysis_cache
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON token_usage_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_usage_agent ON token_usage_log (agent_name);
CREATE INDEX IF NOT EXISTS idx_ceo_cache_created_at ON ceo_analysis_cache (created_at DESC);