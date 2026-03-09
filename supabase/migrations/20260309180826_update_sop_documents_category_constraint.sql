/*
  # Update sop_documents category constraint

  1. Modified Tables
    - `sop_documents`
      - Updated category constraint to include 'Sonstiges'
  2. Notes
    - Drops old constraint and creates new one with added value
*/

ALTER TABLE sop_documents DROP CONSTRAINT IF EXISTS sop_documents_category_check;

ALTER TABLE sop_documents ADD CONSTRAINT sop_documents_category_check
  CHECK (category IN ('Content', 'Sales', 'Operations', 'Training', 'Tech', 'Sonstiges'));
