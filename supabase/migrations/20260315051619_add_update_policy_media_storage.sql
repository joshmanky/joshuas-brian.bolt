/*
  # Add UPDATE policy to media storage bucket

  1. Security Changes
    - Add UPDATE policy for anon role on media bucket (required for TUS resumable uploads)

  2. Notes
    - TUS protocol uses x-upsert header which requires UPDATE permission
    - Without this policy, resumable uploads fail
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Allow anonymous updates to media bucket'
  ) THEN
    CREATE POLICY "Allow anonymous updates to media bucket"
      ON storage.objects
      FOR UPDATE
      TO anon
      USING (bucket_id = 'media')
      WITH CHECK (bucket_id = 'media');
  END IF;
END $$;