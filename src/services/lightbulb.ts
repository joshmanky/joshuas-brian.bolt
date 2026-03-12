// Lightbulb service: CRUD for lightbulb_editions + Claude generation
// Updated: compressed system prompt
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';

export interface LightbulbEdition {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  raw_input: string;
  created_at: string;
}

export const LIGHTBULB_SYSTEM_PROMPT = `Du bist Joshua Tischer (@joshmanky). Schreibe einen taeglichen Impuls-Newsletter: Realtalk, psychologisch scharf, Anti-Guru, max 200 Worte. Struktur: 1. Ueberschrift (max 8 Worte), 2. Kern-Gedanke (2-3 Saetze), 3. Warum jetzt relevant, 4. Frage an dich, 5. Micro-Action.`;

export const LIGHTBULB_CATEGORIES = [
  'Mindset',
  'Identitaet',
  'Business',
  'Trading',
  'Spiritualitaet',
  'Beziehung',
  'Sonstiges',
] as const;

export async function generateLightbulb(
  thema: string,
  quelle: string,
  gedanke: string,
  kategorie: string
): Promise<string> {
  const userMessage = `Thema: ${thema}. Quelle: ${quelle}. Gedanke/Zitat: ${gedanke}. Kategorie: ${kategorie}.`;
  const result = await callClaude(LIGHTBULB_SYSTEM_PROMPT, userMessage, undefined, undefined, 'Lightbulb Lab Agent');
  await logAiTask('Lightbulb Lab Agent', 'lightbulb_generation', result);
  return result;
}

export async function saveLightbulbEdition(edition: {
  title: string;
  content: string;
  category: string;
  source: string;
  raw_input: string;
}): Promise<LightbulbEdition | null> {
  const { data } = await supabase
    .from('lightbulb_editions')
    .insert(edition)
    .select()
    .maybeSingle();

  if (data) {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await supabase.from('brain_documents').insert({
        filename: `${edition.title} (${today})`,
        category: 'lightbulb',
        file_path: '',
        extracted_quotes: [],
        extracted_insights: [edition.content.slice(0, 500)],
        full_text: edition.content,
      });
    } catch {
      // silent - brain sync should not break save flow
    }
  }

  return data as LightbulbEdition | null;
}

export async function getAllLightbulbEditions(): Promise<LightbulbEdition[]> {
  const { data } = await supabase
    .from('lightbulb_editions')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as LightbulbEdition[];
}

export async function deleteLightbulbEdition(id: string): Promise<void> {
  await supabase.from('lightbulb_editions').delete().eq('id', id);
}
