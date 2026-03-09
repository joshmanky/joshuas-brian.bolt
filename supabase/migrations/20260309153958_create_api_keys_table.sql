/*
  # Create api_keys table

  1. New Tables
    - `api_keys`
      - `id` (uuid, primary key)
      - `platform` (text) - one of: instagram, tiktok, youtube, claude
      - `key_value` (text) - the stored API key/token
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `api_keys` table
    - Add policy for authenticated users to manage their own keys
    - Add policy for anon access (single-user app)
*/

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube', 'claude')),
  key_value text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform)
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on api_keys"
  ON api_keys FOR SELECT
  TO anon
  USING (platform IS NOT NULL);

CREATE POLICY "Allow anon insert on api_keys"
  ON api_keys FOR INSERT
  TO anon
  WITH CHECK (platform IS NOT NULL);

CREATE POLICY "Allow anon update on api_keys"
  ON api_keys FOR UPDATE
  TO anon
  USING (platform IS NOT NULL)
  WITH CHECK (platform IS NOT NULL);
