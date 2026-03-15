/*
  # Create Media Storage Bucket

  1. Storage
    - Create public bucket `media` for video and image uploads
    - File size limit: 524288000 bytes (500 MB)
    - Allowed MIME types: video/mp4, video/quicktime, image/jpeg, image/png, image/webp

  2. Security (Storage RLS Policies)
    - Allow anonymous uploads (INSERT) to the media bucket
    - Allow anonymous reads (SELECT) from the media bucket
    - Allow anonymous deletes (DELETE) from the media bucket

  Note: This project does not use authentication, so policies allow
  anon access. The bucket is public so files can be served via URL.
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  524288000,
  ARRAY['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Allow anonymous uploads to media bucket"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'media');

CREATE POLICY "Allow anonymous reads from media bucket"
  ON storage.objects FOR SELECT
  TO anon
  USING (bucket_id = 'media');

CREATE POLICY "Allow anonymous deletes from media bucket"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'media');
