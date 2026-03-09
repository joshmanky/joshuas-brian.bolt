/*
  # Create attributions table

  1. New Tables
    - `attributions`
      - `id` (uuid, primary key)
      - `lead_name` (text) - name of the lead/customer
      - `channel` (text) - Instagram DM, TikTok, YouTube, Telegram, WhatsApp, Email
      - `content_title` (text) - which post/video triggered the lead
      - `revenue` (numeric) - revenue in Euro
      - `date` (date) - conversion date
      - `notes` (text) - additional notes
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on `attributions` table
    - Policies for anon CRUD (single-user dashboard)
*/

CREATE TABLE IF NOT EXISTS attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_name text NOT NULL DEFAULT '',
  channel text NOT NULL DEFAULT 'Instagram DM',
  content_title text NOT NULL DEFAULT '',
  revenue numeric NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),

  CONSTRAINT attributions_channel_check
    CHECK (channel IN ('Instagram DM', 'TikTok', 'YouTube', 'Telegram', 'WhatsApp', 'Email'))
);

ALTER TABLE attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on attributions"
  ON attributions FOR SELECT TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anon insert on attributions"
  ON attributions FOR INSERT TO anon
  WITH CHECK (channel IN ('Instagram DM', 'TikTok', 'YouTube', 'Telegram', 'WhatsApp', 'Email'));

CREATE POLICY "Allow anon update on attributions"
  ON attributions FOR UPDATE TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (channel IN ('Instagram DM', 'TikTok', 'YouTube', 'Telegram', 'WhatsApp', 'Email'));

CREATE POLICY "Allow anon delete on attributions"
  ON attributions FOR DELETE TO anon
  USING (created_at IS NOT NULL);
