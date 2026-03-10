// Research service: CRUD for research_items + AI idea generation via Claude — added AI task logging
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import type { ResearchItem } from '../types';

export async function getAllResearchItems(): Promise<ResearchItem[]> {
  const { data } = await supabase
    .from('research_items')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as ResearchItem[];
}

export async function createResearchItem(item: {
  title: string;
  hook_type: string;
  platform: string;
  status?: string;
}): Promise<ResearchItem | null> {
  const { data } = await supabase
    .from('research_items')
    .insert({
      title: item.title,
      hook_type: item.hook_type,
      platform: item.platform,
      status: item.status || 'new',
    })
    .select()
    .maybeSingle();
  return data as ResearchItem | null;
}

export async function updateResearchItemStatus(id: string, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('research_items')
    .update({ status })
    .eq('id', id);
  return !error;
}

export async function deleteResearchItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('research_items')
    .delete()
    .eq('id', id);
  return !error;
}

export async function generateResearchIdeas(): Promise<ResearchItem[]> {
  const { data: topPosts } = await supabase
    .from('instagram_posts')
    .select('caption, like_count, media_type')
    .order('like_count', { ascending: false })
    .limit(5);

  const postsContext = (topPosts || [])
    .map((p, i) => `${i + 1}. "${(p.caption || '').slice(0, 120)}" (${p.like_count} Likes, ${p.media_type})`)
    .join('\n');

  const systemPrompt = `Du bist Joshua Tischer's (@joshmanky) Content-Stratege. Analysiere seine Top-Posts und generiere neue Content-Ideen.

JOSHS ECHTE NISCHE: Psychologische Blockadenloesung fuer "innerlich festgefahrene Potenzialtraeger" 20-30 Jahre. Das Business (Network Marketing / Trading) ist das Vehikel. Das echte Produkt: Identitaetswachstum und Charakterentwicklung.

ANTI-GURU-POSITIONIERUNG: Ruhig, analytisch, kein Hustle-Bro. Fokus IMMER auf das Hindernis (Prokrastination, Overthinking, Identitaetskonflikt) — NICHT auf das Endziel (Geld, Autos, Freiheit). Vertrauen durch Verstaendnis, nicht durch Druck.

JOSHS 12 THEMEN-KATEGORIEN (nutze diese, nicht generische Themen):
1. Network Marketing Mythen brechen (Positionierung: Community, Skill, System — NIE "MLM")
2. Unternehmer-Fehler die 90% machen
3. Identitaetskonflikt und Mindset ("Du bist nicht faul. Du hast einen Identitaetskonflikt.")
4. System-Denken vs. Zufalls-Handeln
5. H.I.S.-Methode erklaeren (High Income Skill: lerne -> kopiere Experten -> teile -> verdiene)
6. Angestellt vs. Unternehmer (Kontrast, kein Angriff auf Jobs)
7. Buch-Weisheit und psychologische Modelle in 60 Sekunden
8. Trading-Prozess zeigen (nicht Gewinne prahlen)
9. Sales als Lebenskompetenz
10. Ortsunabhaengiges Leben Thailand (zeigen, nicht prahlen)
11. Geld-Psychologie und finanzielles Denken
12. Beziehung + Business mit Raquel

Antworte NUR als JSON: [{"title": "...", "hook_type": "statement_hook|question_hook|contrast_hook|identity_hook|number_hook", "platform": "instagram|tiktok|youtube", "reason": "Warum das bei Joshs Zielgruppe viral geht — basierend auf Top-Post-Mustern"}]`;

  const userMessage = postsContext
    ? `Top performing posts von @joshmanky:\n${postsContext}\n\nGeneriere 6 neue Video-Ideen aus den 12 Themen-Kategorien die auf denselben psychologischen Mustern basieren. Erklaere bei jeder Idee WARUM sie funktionieren wird.`
    : `Generiere 6 Video-Ideen aus Joshs 12 Themen-Kategorien fuer seine Zielgruppe (innerlich festgefahrene 20-30 Jaehrige). Erklaere bei jeder Idee den psychologischen Grund.`;

  const raw = await callClaude(systemPrompt, userMessage);
  await logAiTask('Content Research Agent', 'research_idea_generation', raw);

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const ideas = JSON.parse(jsonMatch[0]) as {
    title: string;
    hook_type: string;
    platform: string;
    reason?: string;
  }[];

  const created: ResearchItem[] = [];
  for (const idea of ideas.slice(0, 6)) {
    const titleWithReason = idea.reason
      ? `${idea.title} | ${idea.reason}`
      : idea.title;
    const item = await createResearchItem({
      title: titleWithReason,
      hook_type: idea.hook_type || 'Statement',
      platform: idea.platform || 'instagram',
    });
    if (item) created.push(item);
  }

  return created;
}
