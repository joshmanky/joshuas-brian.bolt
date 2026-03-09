/*
  # Create Instagram data tables

  1. New Tables
    - `instagram_data` - cached Instagram profile stats
      - `id` (uuid, primary key)
      - `followers_count` (integer)
      - `media_count` (integer)
      - `fetched_at` (timestamptz)
    - `instagram_posts` - individual Instagram posts
      - `id` (uuid, primary key)
      - `ig_id` (text, unique) - Instagram post ID
      - `caption` (text)
      - `like_count` (integer)
      - `comments_count` (integer)
      - `media_type` (text) - IMAGE, VIDEO, CAROUSEL_ALBUM
      - `media_url` (text)
      - `thumbnail_url` (text)
      - `timestamp` (timestamptz)
      - `fetched_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add anon access policies for single-user app
*/

CREATE TABLE IF NOT EXISTS instagram_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followers_count integer NOT NULL DEFAULT 0,
  media_count integer NOT NULL DEFAULT 0,
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE instagram_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on instagram_data"
  ON instagram_data FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on instagram_data"
  ON instagram_data FOR INSERT TO anon
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anon delete on instagram_data"
  ON instagram_data FOR DELETE TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS instagram_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_id text UNIQUE NOT NULL,
  caption text DEFAULT '',
  like_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  media_type text NOT NULL DEFAULT 'IMAGE',
  media_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  timestamp timestamptz DEFAULT now(),
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on instagram_posts"
  ON instagram_posts FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on instagram_posts"
  ON instagram_posts FOR INSERT TO anon
  WITH CHECK (ig_id IS NOT NULL);

CREATE POLICY "Allow anon delete on instagram_posts"
  ON instagram_posts FOR DELETE TO anon
  USING (id IS NOT NULL);
