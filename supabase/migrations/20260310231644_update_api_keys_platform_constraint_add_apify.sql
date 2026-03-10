/*
  # Update api_keys platform constraint

  1. Modified Tables
    - `api_keys`
      - Drop existing `api_keys_platform_check` constraint
      - Add updated constraint including 'apify' platform

  2. Important Notes
    - Adds 'apify' as a valid platform value
    - All existing platform values remain valid
*/

ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_platform_check;

ALTER TABLE api_keys ADD CONSTRAINT api_keys_platform_check
CHECK (platform IN ('instagram', 'youtube', 'claude', 'tiktok', 'canva_access_token', 'canva_refresh_token', 'apify'));
