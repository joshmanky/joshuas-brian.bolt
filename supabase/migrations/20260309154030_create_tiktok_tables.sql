/*
  # Create TikTok data tables

  1. New Tables
    - `tiktok_data` - cached TikTok profile stats
      - `id` (uuid, primary key)
      - `followers` (integer)
      - `total_likes` (integer)
      - `video_count` (integer)
      - `fetched_at` (timestamptz)
    - `tiktok_videos` - individual TikTok videos
      - `id` (uuid, primary key)
      - `video_id` (text, unique)
      - `description` (text)
      - `views` (integer)
      - `likes` (integer)
      - `comments` (integer)
      - `shares` (integer)
      - `thumbnail_url` (text)
      - `created_at` (timestamptz)
      - `fetched_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add anon access policies for single-user app
*/

CREATE TABLE IF NOT EXISTS tiktok_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followers integer NOT NULL DEFAULT 0,
  total_likes integer NOT NULL DEFAULT 0,
  video_count integer NOT NULL DEFAULT 0,
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE tiktok_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on tiktok_data"
  ON tiktok_data FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on tiktok_data"
  ON tiktok_data FOR INSERT TO anon
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anon delete on tiktok_data"
  ON tiktok_data FOR DELETE TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS tiktok_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text UNIQUE NOT NULL,
  description text DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  thumbnail_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE tiktok_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on tiktok_videos"
  ON tiktok_videos FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on tiktok_videos"
  ON tiktok_videos FOR INSERT TO anon
  WITH CHECK (video_id IS NOT NULL);

CREATE POLICY "Allow anon delete on tiktok_videos"
  ON tiktok_videos FOR DELETE TO anon
  USING (id IS NOT NULL);
