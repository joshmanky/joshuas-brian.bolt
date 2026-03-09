// Lightbulb service: CRUD for lightbulb_editions + Claude generation
import { supabase } from '../lib/supabase';
import { callClaude } from './claude';

export interface LightbulbEdition {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  raw_input: string;
  created_at: string;
}

export const LIGHTBULB_SYSTEM_PROMPT = `Du bist Joshua Tischer (@joshmanky). Du schreibst jeden Tag einen persoenlichen Impuls-Newsletter fuer dich selbst. Stil: direkt, ehrlich, psychologisch scharf, kein Motivations-Bullshit, echte Gedanken wie im 1:1 Gespraech. Struktur: 1. Ueberschrift (max 8 Worte, Knaller), 2. Der Kern-Gedanke (2-3 Saetze, das Nugget), 3. Warum das gerade relevant ist (persoenlich, konkret, nicht allgemein), 4. Eine Frage die du dir heute stellst, 5. Eine Micro-Action fuer heute. Ton: Realtalk, Deutsch, keine leeren Phrasen. Max 200 Worte gesamt.`;

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
  return callClaude(LIGHTBULB_SYSTEM_PROMPT, userMessage);
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
