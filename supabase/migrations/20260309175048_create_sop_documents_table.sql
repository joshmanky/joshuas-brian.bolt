/*
  # Create sop_documents table

  1. New Tables
    - `sop_documents`
      - `id` (uuid, primary key)
      - `title` (text) - SOP document title
      - `category` (text) - Content, Sales, Operations, Training, Tech
      - `description` (text) - the process description / body text
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS on `sop_documents` table
    - Add policies for anon access (single-user dashboard, no auth)
*/

CREATE TABLE IF NOT EXISTS sop_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Content',
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT sop_documents_category_check
    CHECK (category IN ('Content', 'Sales', 'Operations', 'Training', 'Tech'))
);

ALTER TABLE sop_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on sop_documents"
  ON sop_documents
  FOR SELECT
  TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anon insert on sop_documents"
  ON sop_documents
  FOR INSERT
  TO anon
  WITH CHECK (category IN ('Content', 'Sales', 'Operations', 'Training', 'Tech'));

CREATE POLICY "Allow anon update on sop_documents"
  ON sop_documents
  FOR UPDATE
  TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (category IN ('Content', 'Sales', 'Operations', 'Training', 'Tech'));

CREATE POLICY "Allow anon delete on sop_documents"
  ON sop_documents
  FOR DELETE
  TO anon
  USING (created_at IS NOT NULL);
