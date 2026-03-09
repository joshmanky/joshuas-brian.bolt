/*
  # Create content_research_items table

  1. New Tables
    - `content_research_items`
      - `id` (uuid, primary key)
      - `topic` (text) - the topic title or raw idea
      - `hook_suggestion` (text) - suggested hook for the content
      - `platform` (text) - target platform (instagram, tiktok, youtube)
      - `status` (text) - New / In Pipeline / Done
      - `source` (text) - how the idea was created: manual, ai_generated, trending
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `content_research_items` table
    - Add policies for anon access (single-user dashboard, no auth)
*/

CREATE TABLE IF NOT EXISTS content_research_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL DEFAULT '',
  hook_suggestion text DEFAULT '',
  platform text DEFAULT 'instagram',
  status text NOT NULL DEFAULT 'New',
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),

  CONSTRAINT content_research_items_status_check
    CHECK (status IN ('New', 'In Pipeline', 'Done')),
  CONSTRAINT content_research_items_platform_check
    CHECK (platform IN ('instagram', 'tiktok', 'youtube'))
);

ALTER TABLE content_research_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on content_research_items"
  ON content_research_items
  FOR SELECT
  TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anon insert on content_research_items"
  ON content_research_items
  FOR INSERT
  TO anon
  WITH CHECK (status IN ('New', 'In Pipeline', 'Done'));

CREATE POLICY "Allow anon update on content_research_items"
  ON content_research_items
  FOR UPDATE
  TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (status IN ('New', 'In Pipeline', 'Done'));

CREATE POLICY "Allow anon delete on content_research_items"
  ON content_research_items
  FOR DELETE
  TO anon
  USING (created_at IS NOT NULL);
