/*
  # Create YouTube data tables

  1. New Tables
    - `youtube_data` - cached YouTube channel stats
      - `id` (uuid, primary key)
      - `subscribers` (integer)
      - `total_views` (bigint)
      - `video_count` (integer)
      - `fetched_at` (timestamptz)
    - `youtube_videos` - individual YouTube videos
      - `id` (uuid, primary key)
      - `yt_id` (text, unique)
      - `title` (text)
      - `thumbnail_url` (text)
      - `views` (integer)
      - `likes` (integer)
      - `comments` (integer)
      - `published_at` (timestamptz)
      - `fetched_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add anon access policies for single-user app
*/

CREATE TABLE IF NOT EXISTS youtube_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscribers integer NOT NULL DEFAULT 0,
  total_views bigint NOT NULL DEFAULT 0,
  video_count integer NOT NULL DEFAULT 0,
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE youtube_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on youtube_data"
  ON youtube_data FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on youtube_data"
  ON youtube_data FOR INSERT TO anon
  WITH CHECK (id IS NOT NULL);

CREATE POLICY "Allow anon delete on youtube_data"
  ON youtube_data FOR DELETE TO anon
  USING (id IS NOT NULL);

CREATE TABLE IF NOT EXISTS youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  yt_id text UNIQUE NOT NULL,
  title text DEFAULT '',
  thumbnail_url text DEFAULT '',
  views integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  published_at timestamptz DEFAULT now(),
  fetched_at timestamptz DEFAULT now()
);

ALTER TABLE youtube_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on youtube_videos"
  ON youtube_videos FOR SELECT TO anon
  USING (id IS NOT NULL);

CREATE POLICY "Allow anon insert on youtube_videos"
  ON youtube_videos FOR INSERT TO anon
  WITH CHECK (yt_id IS NOT NULL);

CREATE POLICY "Allow anon delete on youtube_videos"
  ON youtube_videos FOR DELETE TO anon
  USING (id IS NOT NULL);
