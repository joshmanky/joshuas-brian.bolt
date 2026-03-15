/*
  # Add hook_templates table and extend saved_content

  1. New Tables
    - `hook_templates`
      - id, template_text, category, example, performance_score, times_used, created_at

  2. Modified Tables
    - `saved_content`
      - Add `hook_template` TEXT (abstract template behind the hook)
      - Add `storytelling_framework` TEXT (framework used)
      - Add `outlier_score` INTEGER (viral potential 1-100)
      - Add `project_folder` TEXT DEFAULT 'Allgemein'

  3. Security
    - Enable RLS on hook_templates
    - Anon read/insert/update/delete policies (same pattern as other tables)

  4. Seed Data
    - 8 pre-built hook templates tailored to Joshua's niche
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_content' AND column_name = 'hook_template'
  ) THEN
    ALTER TABLE saved_content ADD COLUMN hook_template TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_content' AND column_name = 'storytelling_framework'
  ) THEN
    ALTER TABLE saved_content ADD COLUMN storytelling_framework TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_content' AND column_name = 'outlier_score'
  ) THEN
    ALTER TABLE saved_content ADD COLUMN outlier_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_content' AND column_name = 'project_folder'
  ) THEN
    ALTER TABLE saved_content ADD COLUMN project_folder TEXT DEFAULT 'Allgemein';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'watch_accounts' AND column_name = 'niche_relevance'
  ) THEN
    ALTER TABLE watch_accounts ADD COLUMN niche_relevance TEXT DEFAULT 'inspiration';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS hook_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_text TEXT NOT NULL,
  category TEXT,
  example TEXT,
  performance_score INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE hook_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon can read hook_templates"
  ON hook_templates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "anon can insert hook_templates"
  ON hook_templates FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "anon can update hook_templates"
  ON hook_templates FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "anon can delete hook_templates"
  ON hook_templates FOR DELETE
  TO anon
  USING (true);

INSERT INTO hook_templates (template_text, category, example, performance_score) VALUES
('Du bist nicht [Problem]. Du hast einen [tiefere Ursache].', 'Identität', 'Du bist nicht faul. Du hast einen Identitätskonflikt.', 95),
('Vergiss alles über [bekanntes Konzept]. Es geht nicht um [Oberfläche]. Es geht um [tiefere Wahrheit].', 'Reframe', 'Vergiss alles über Erfolg. Es geht nicht um 3 Lambos.', 90),
('90% der [Zielgruppe] machen diesen einen Fehler: [Fehler].', 'Zahl', '90% aller Unternehmer machen diesen Fehler: Sie kopieren Strategien statt Systeme.', 88),
('[Kontrast 1] tauscht [X] gegen [Y]. [Kontrast 2] tauscht [A] gegen [B].', 'Kontrast', 'Angestellte tauschen Zeit gegen Geld. Unternehmer tauschen Probleme gegen Wachstum.', 85),
('Warum [Zielgruppe] niemals [Ziel erreichen]: [überraschende Ursache]', 'Frage', 'Warum 90% der Potenzialträger niemals starten: Identitätskonflikt.', 87),('[Bekannter Spruch]" - dieser Satz hat [negative Konsequenz]. Hier die Wahrheit...', 'Mythos brechen', '"Geld macht nicht glücklich" - dieser Satz hält dich arm.', 89),
('Ich dachte, [falsche Annahme]. Heute weiß ich: [Wahrheit].', 'Personal Story', 'Ich dachte, Verantwortung sei ein Fluch. Heute weiß ich: Es ist ein Segen.', 86),
('Warte nicht auf [perfekter Moment]. Er wird nicht kommen. [Alternative Wahrheit].', 'Anti-Perfektionismus', 'Warte nicht auf den perfekten Trade-Setup. Er wird nicht kommen.', 84)
ON CONFLICT DO NOTHING;
