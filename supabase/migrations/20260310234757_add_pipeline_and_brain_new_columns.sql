/*
  # Add new columns for Content Studio workflow

  1. Modified Tables
    - `pipeline_cards`
      - `caption` (text) - generated caption for social media post
      - `hashtags` (text) - generated hashtags
      - `canva_design_url` (text) - link to Canva design
      - `scheduled_date` (timestamptz) - planned posting date
    - `brain_documents`
      - `type` (text, default 'document') - document type: 'document' or 'video_transcript'

  2. Important Notes
    - All new columns are nullable for backwards compatibility
    - brain_documents.type defaults to 'document' so existing rows are unaffected
*/

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
    WHERE table_name = 'brain_documents' AND column_name = 'type'
  ) THEN
    ALTER TABLE brain_documents ADD COLUMN type TEXT DEFAULT 'document';
  END IF;
END $$;
