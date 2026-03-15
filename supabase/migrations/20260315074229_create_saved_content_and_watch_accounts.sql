/*
  # Create saved_content and watch_accounts tables

  1. New Tables
    - `saved_content`
      - `id` (uuid, primary key)
      - `source_url` (text) - original URL of the analyzed content
      - `source_platform` (text, default 'instagram')
      - `creator_name` (text) - @username of the creator
      - `raw_input` (text) - the pasted caption or transcript
      - `hook_text` (text) - original hook extracted by AI
      - `video_format` (text) - Talking Head / B-Roll / etc.
      - `why_it_works` (text) - psychological analysis
      - `niche_adaptation` (text) - how to adapt for Joshua's niche
      - `adapted_hook` (text) - ready-to-use adapted hook
      - `tags` (text[]) - topic tags
      - `performance_estimate` (text, default 'mittel') - hoch/mittel/niedrig
      - `status` (text, default 'neu')
      - `used_as_idea` (boolean, default false)
      - `created_at` (timestamp)

    - `watch_accounts`
      - `id` (uuid, primary key)
      - `username` (text, not null)
      - `platform` (text, default 'tiktok')
      - `notes` (text)
      - `last_scraped` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add anon policies for full access (consistent with rest of app)
*/

CREATE TABLE IF NOT EXISTS saved_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_url TEXT,
  source_platform TEXT DEFAULT 'instagram',
  creator_name TEXT,
  raw_input TEXT,
  hook_text TEXT,
  video_format TEXT,
  why_it_works TEXT,
  niche_adaptation TEXT,
  adapted_hook TEXT,
  tags TEXT[],
  performance_estimate TEXT DEFAULT 'mittel',
  status TEXT DEFAULT 'neu',
  used_as_idea BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watch_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'tiktok',
  notes TEXT,
  last_scraped TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can select saved_content"
  ON saved_content FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert saved_content"
  ON saved_content FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update saved_content"
  ON saved_content FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete saved_content"
  ON saved_content FOR DELETE TO anon USING (true);

CREATE POLICY "anon can select watch_accounts"
  ON watch_accounts FOR SELECT TO anon USING (true);

CREATE POLICY "anon can insert watch_accounts"
  ON watch_accounts FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon can update watch_accounts"
  ON watch_accounts FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon can delete watch_accounts"
  ON watch_accounts FOR DELETE TO anon USING (true);