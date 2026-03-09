/*
  # Create research_items table

  1. New Tables
    - `research_items`
      - `id` (uuid, primary key)
      - `title` (text) - idea title
      - `hook_type` (text) - Identitaet/Frage/Zahlen/Kontrast/Statement
      - `platform` (text) - instagram/tiktok/youtube
      - `status` (text) - new/in_pipeline/done
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `research_items` table
    - Policies for anon CRUD (single-user dashboard)
*/

CREATE TABLE IF NOT EXISTS research_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  hook_type text NOT NULL DEFAULT 'statement_hook',
  platform text NOT NULL DEFAULT 'instagram',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now(),

  CONSTRAINT research_items_platform_check
    CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  CONSTRAINT research_items_status_check
    CHECK (status IN ('new', 'in_pipeline', 'done'))
);

ALTER TABLE research_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on research_items"
  ON research_items FOR SELECT TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anon insert on research_items"
  ON research_items FOR INSERT TO anon
  WITH CHECK (platform IN ('instagram', 'tiktok', 'youtube'));

CREATE POLICY "Allow anon update on research_items"
  ON research_items FOR UPDATE TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (status IN ('new', 'in_pipeline', 'done'));

CREATE POLICY "Allow anon delete on research_items"
  ON research_items FOR DELETE TO anon
  USING (created_at IS NOT NULL);
