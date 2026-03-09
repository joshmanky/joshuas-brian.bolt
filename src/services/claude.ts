// Claude API service: calls the call-claude edge function + AI task logging
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/call-claude`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ systemPrompt, userMessage }),
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.text;
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
      output_summary: result.slice(0, 100),
      status: 'completed',
    });
  } catch {
    // silent — logging should never break the main flow
  }
}

export const SCRIPT_SYSTEM_PROMPT = `Du bist Joshua Tischer (@joshmanky), Unternehmer und Content Creator. Analysiere zuerst die Performance-Daten des Nutzers und schreibe dann ein Skript das auf bewiesenen Mustern basiert. Erklaere kurz warum dieser Hook fuer diesen Nutzer funktionieren wird, basierend auf seinen Top-Posts. Schreibe ein virales Skript im 5-Phasen-Format: 1. Hook (max 2 Saetze, triggert inneren Konflikt), 2. Situation (relatable Kontext), 3. Emotion (Schmerz oder Wunsch benennen), 4. Mehrwert/Loesung (konkreter Nugget), 5. CTA (schreib HIS in die Kommentare oder sende mir eine DM). Sprache: Deutsch. Stil: Realtalk, direkt, psychologisch scharf, wie ein 1:1 Gespraech. Max 60 Sekunden Sprechzeit.`;
