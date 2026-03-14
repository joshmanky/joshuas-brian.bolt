/*
  # Create media_library table and extend pipeline_cards

  1. New Tables
    - `media_library`
      - `id` (uuid, primary key)
      - `file_url` (text, not null) - URL of the uploaded file in Supabase Storage
      - `filename` (text, not null) - Original filename
      - `type` (text, default 'video') - video or image
      - `duration_seconds` (integer) - Duration for videos
      - `mood` (text) - ruhig / energetisch / emotional / motivierend / humorvoll
      - `scene` (text) - outdoor / indoor / urban / travel / gym / talking-head / lifestyle
      - `has_face` (boolean, default false) - Whether face is visible
      - `speaking` (boolean, default false) - Whether person is speaking
      - `tags` (text[]) - User-defined tags
      - `ai_description` (text) - AI-generated description
      - `thumbnail_url` (text) - Thumbnail for preview
      - `created_at` (timestamptz, default now())

  2. Modified Tables
    - `pipeline_cards`
      - Added `caption` (text)
      - Added `hashtags` (text)
      - Added `canva_design_url` (text)
      - Added `scheduled_date` (timestamptz)
      - Added `media_id` (uuid, references media_library)
      - Added `views_48h` (integer, default 0)
      - Added `likes_48h` (integer, default 0)
      - Added `watchtime_score` (integer, default 0)
    - `brain_documents`
      - Added `type` (text, default 'document')

  3. Security
    - Enable RLS on `media_library`
    - Add anon policies for CRUD on media_library (matching existing app pattern)
*/

CREATE TABLE IF NOT EXISTS media_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_url TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT DEFAULT 'video',
  duration_seconds INTEGER,
  mood TEXT,
  scene TEXT,
  has_face BOOLEAN DEFAULT false,
  speaking BOOLEAN DEFAULT false,
  tags TEXT[],
  ai_description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on media_library"
  ON media_library FOR SELECT
  TO anon
  USING (created_at IS NOT NULL);

CREATE POLICY "Allow anon insert on media_library"
  ON media_library FOR INSERT
  TO anon
  WITH CHECK (filename IS NOT NULL);

CREATE POLICY "Allow anon update on media_library"
  ON media_library FOR UPDATE
  TO anon
  USING (created_at IS NOT NULL)
  WITH CHECK (filename IS NOT NULL);

CREATE POLICY "Allow anon delete on media_library"
  ON media_library FOR DELETE
  TO anon
  USING (created_at IS NOT NULL);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'caption'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN caption TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'hashtags'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN hashtags TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'canva_design_url'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN canva_design_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN scheduled_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'media_id'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN media_id UUID REFERENCES media_library(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'views_48h'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN views_48h INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'likes_48h'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN likes_48h INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'watchtime_score'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN watchtime_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brain_documents' AND column_name = 'type'
  ) THEN
    ALTER TABLE brain_documents ADD COLUMN type TEXT DEFAULT 'document';
  END IF;
END $$;
