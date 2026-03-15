/*
  # Add comments_48h column to pipeline_cards

  1. Modified Tables
    - `pipeline_cards`
      - `comments_48h` (integer, default 0) - Tracks comment count after 48 hours for performance analysis

  2. Notes
    - Completes the performance tracking fields alongside existing views_48h, likes_48h, watchtime_score
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pipeline_cards' AND column_name = 'comments_48h'
  ) THEN
    ALTER TABLE pipeline_cards ADD COLUMN comments_48h INTEGER DEFAULT 0;
  END IF;
END $$;