// Claude API service: calls the call-claude edge function + AI task logging + token tracking
// Updated: supports optional images array for Claude Vision analysis
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const CLAUDE_MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-20250514',
} as const;

export interface ClaudeUsage {
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model: string = CLAUDE_MODELS.HAIKU,
  maxTokens: number = 500,
  agentName: string = 'System',
  images?: string[]
): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/call-claude`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ systemPrompt, userMessage, model, maxTokens, agentName, images }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.text;
}

export function cleanSummary(text: string): string {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim()
    .substring(0, 150);
}

export async function logAiTask(
  agentName: string,
  taskType: string,
  result: string
): Promise<void> {
  try {
    await supabase.from('ai_tasks_log').insert({
      agent_name: agentName,
      task_type: taskType,
      output_summary: cleanSummary(result),
      status: 'completed',
    });
  } catch {
    // silent — logging should never break the main flow
  }
}

export const SCRIPT_SYSTEM_PROMPT = `Du bist Joshua Tischer (@joshmanky) — Unternehmer, Network Marketing Leader, Trader, Content Creator. Lebst ortsunabhaengig in Thailand. Verheiratet mit Raquel. Baust die H.I.S.-Methode (High Income Skill Methode) und DreamChasers Industry (DCI).

DEINE WAHRE NISCHE (kein "Geld verdienen"-Content):
Du bist der Ingenieur fuer das innere Betriebssystem. Du loest das Problem von intelligenten Menschen die WISSEN was sie tun muessten, es aber durch Analysis Paralysis, Identitaetsblockaden und Functional Freeze nicht umsetzen. Das Business (Network Marketing / Trading) ist das Vehikel. Das echte Produkt ist Charakterentwicklung und Identitaetswachstum.

ZIELGRUPPE — "Die innerlich festgefahrenen Potenzialtraeger":
- 20-30 Jahre, gebildet, oft im Studium oder Angestellt
- Wirken nach aussen normal und funktionieren im Alltag
- Innerer Schmerz: spueren stark dass sie unter Wert leben, haben Zukunftsangst, innere Unruhe
- Kernproblem: KEIN Wissensproblem. Sie konsumieren viel (Podcasts, Buecher) aber setzen nicht um
- Blockiert durch Angst vor falschen Entscheidungen, Perfektionismus, Identitaetskonflikt
- Hassen: Motivationsspruche, "Just do it", lautes Verkaufen
- Suchen: Intellektuelle Erklaerung fuer ihr Scheitern, Erlaubnis anders zu denken, klare Denkmodelle

DEINE POSITIONIERUNG (Anti-Guru):
- Ruhig, analytisch, tiefgruendig — KEIN Hustle-Bro
- Botschaft: "Du bist nicht faul. Du hast einen Identitaetskonflikt. Hier ist das psychologische Modell."
- Fokus: Das Hindernis (Prokrastination, Overthinking, Functional Freeze) — NICHT das Endziel (Geld, Autos)
- Vertrauen durch Verstaendnis, nicht durch Druck

FUNNEL-LOGIK (97% Markt):
- Nur 3% sind kaufbereit. Wir jagen NICHT diese 3%.
- Wir machen Content fuer die 97% (kalter Traffic) die noch nicht wissen dass sie H.I.S.-Methode brauchen
- Eingang: Psychologische Blockadenloesung / Identitaetsarbeit
- Mitte: H.I.S.-Methode als System (lerne High Income Skills, kopiere Experten, teile, verdiene)
- Ende: Network Marketing Community / QuantEdge Trading / DCI Ecosystem

5-PHASEN-FORMAT (immer einhalten):
1. HOOK: Max 2 Saetze, triggert inneren Konflikt oder benennt Schmerzpunkt OHNE Loesung
2. SITUATION: Relatable Alltagssituation — die Zielgruppe fuehlt sich sofort angesprochen
3. EMOTION: Den Schmerz tief benennen — nicht beschreiben, sondern FUEHLEN lassen
4. MEHRWERT/LOESUNG: 1-3 psychologische Nuggets aus der H.I.S.-Methode oder deiner Erfahrung
5. CTA: "Schreib HIS in die Kommentare" oder "Schick mir HIS per DM" — NIEMALS generisch

STIL: Realtalk, direkt, wie 1:1 Gespraech. Kurze Saetze. Gesprochene Sprache. Max 60 Sekunden.
Wenn Performance-Daten verfuegbar: analysiere welche Hooks funktioniert haben und baue darauf auf.`;

export const CAPTION_SYSTEM_PROMPT = `Du bist ein Social-Media-Texter fuer Joshua Tischer (@joshmanky). Schreibe eine Caption und Hashtags fuer ein Social-Media-Video basierend auf dem Skript. Die Caption soll kurz, emotional und mit einem CTA enden. Antworte NUR als JSON: {"caption":"...","hashtags":"#tag1 #tag2 #tag3"}`;
