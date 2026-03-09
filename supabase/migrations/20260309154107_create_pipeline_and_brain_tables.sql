/*
  # Create pipeline_cards, brain_documents, and ai_tasks_log tables

  1. New Tables
    - `pipeline_cards` - Kanban board content pipeline
      - `id` (uuid, primary key)
      - `title` (text)
      - `platform` (text) - instagram, tiktok, youtube
      - `hook_type` (text)
      - `status` (text) - idee, skript_fertig, in_bearbeitung, editing, scheduled, published
      - `script_content` (text, nullable)
      - `position` (integer) - ordering within column
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `brain_documents` - knowledge base uploads
      - `id` (uuid, primary key)
      - `filename` (text)
      - `category` (text)
      - `file_path` (text) - Supabase storage path
      - `extracted_quotes` (jsonb)
      - `extracted_insights` (jsonb)
      - `full_text` (text)
      - `created_at` (timestamptz)

    - `ai_tasks_log` - tracks all AI operations
      - `id` (uuid, primary key)
      - `task_type` (text)
      - `input_summary` (text)
      - `output_summary` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add anon access policies for single-user app
*/

CREATE TABLE IF NOT EXISTS pipeline_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  platform text NOT NULL DEFAULT 'instagram',
  hook_type text NOT NULL DEFAULT 'statement_hook',
  status text NOT NULL DEFAULT 'idee' CHECK (status IN ('idee', 'skript_fertig', 'in_bearbeitung', 'editing', 'scheduled', 'published')),
  script_content text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on pipeline_cards"
  ON pipeline_cards FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on pipeline_cards"
  ON pipeline_cards FOR INSERT TO anon
  WITH CHECK (title IS NOT NULL);

CREATE POLICY "Allow anon update on pipeline_cards"
  ON pipeline_cards FOR UPDATE TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anon delete on pipeline_cards"
  ON pipeline_cards FOR DELETE TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS brain_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Reel Script',
  file_path text DEFAULT '',
  extracted_quotes jsonb DEFAULT '[]'::jsonb,
  extracted_insights jsonb DEFAULT '[]'::jsonb,
  full_text text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE brain_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on brain_documents"
  ON brain_documents FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on brain_documents"
  ON brain_documents FOR INSERT TO anon
  WITH CHECK (filename IS NOT NULL);

CREATE POLICY "Allow anon update on brain_documents"
  ON brain_documents FOR UPDATE TO anon
  USING (id IS NOT NULL)
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anon delete on brain_documents"
  ON brain_documents FOR DELETE TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS ai_tasks_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type text NOT NULL DEFAULT '',
  input_summary text DEFAULT '',
  output_summary text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_tasks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on ai_tasks_log"
  ON ai_tasks_log FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on ai_tasks_log"
  ON ai_tasks_log FOR INSERT TO anon
  WITH CHECK (task_type IS NOT NULL);
