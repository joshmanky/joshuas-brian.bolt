/*
  # Create lightbulb_editions table

  1. New Tables
    - `lightbulb_editions`
      - `id` (uuid, primary key) - unique identifier
      - `title` (text) - headline extracted from AI output
      - `content` (text) - full generated edition text
      - `category` (text) - Mindset/Identitaet/Business/Trading/Spiritualitaet/Beziehung/Sonstiges
      - `source` (text) - source/inspiration reference
      - `raw_input` (text) - original raw thought or quote
      - `created_at` (timestamptz) - creation timestamp
  2. Security
    - Enable RLS on `lightbulb_editions` table
    - Add policy for authenticated users to manage their editions
  3. Notes
    - Stores AI-generated daily impulse newsletter editions for Joshua
*/

CREATE TABLE IF NOT EXISTS lightbulb_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Sonstiges'
    CHECK (category IN ('Mindset', 'Identitaet', 'Business', 'Trading', 'Spiritualitaet', 'Beziehung', 'Sonstiges')),
  source text NOT NULL DEFAULT '',
  raw_input text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE lightbulb_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lightbulb editions"
  ON lightbulb_editions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert lightbulb editions"
  ON lightbulb_editions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete lightbulb editions"
  ON lightbulb_editions
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_lightbulb_editions_created_at ON lightbulb_editions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lightbulb_editions_category ON lightbulb_editions (category);
