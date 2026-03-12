// Research service: CRUD for research_items + AI idea generation via Claude
// Updated: 30min in-memory cache for generateResearchIdeas, compressed system prompt
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import type { ResearchItem } from '../types';

const CACHE_TTL = 30 * 60 * 1000;
let researchIdeasCache: { data: ResearchItem[]; timestamp: number } | null = null;

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
  if (researchIdeasCache && Date.now() - researchIdeasCache.timestamp < CACHE_TTL) {
    return researchIdeasCache.data;
  }

  const { data: topPosts } = await supabase
    .from('instagram_posts')
    .select('caption, like_count, media_type')
    .order('like_count', { ascending: false })
    .limit(5);

  const postsContext = (topPosts || [])
    .map((p, i) => `${i + 1}. "${(p.caption || '').slice(0, 120)}" (${p.like_count} Likes, ${p.media_type})`)
    .join('\n');

  const systemPrompt = `Du bist Content-Stratege fuer Joshua Tischer (@joshmanky). Nische: Anti-Guru Blockadenloesung (H.I.S.-Methode) fuer innerlich festgefahrene 20-30-Jaehrige, Network Marketing + Trading als Vehikel. Generiere Ideen aus seinen Themen: NM-Mythen, Unternehmer-Fehler, Identitaetskonflikt, System-Denken, H.I.S.-Methode, Angestellt-vs-Unternehmer, Buch-Weisheit, Trading-Prozess, Sales, Thailand-Leben, Geld-Psychologie, Beziehung+Business. Antworte NUR als JSON: [{"title":"...","hook_type":"statement_hook|question_hook|contrast_hook|identity_hook|number_hook","platform":"instagram|tiktok|youtube","reason":"..."}]`;

  const userMessage = postsContext
    ? `Top performing posts von @joshmanky:\n${postsContext}\n\nGeneriere 6 neue Video-Ideen aus den 12 Themen-Kategorien die auf denselben psychologischen Mustern basieren. Erklaere bei jeder Idee WARUM sie funktionieren wird.`
    : `Generiere 6 Video-Ideen aus Joshs 12 Themen-Kategorien fuer seine Zielgruppe (innerlich festgefahrene 20-30 Jaehrige). Erklaere bei jeder Idee den psychologischen Grund.`;

  const raw = await callClaude(systemPrompt, userMessage, undefined, undefined, 'Content Research Agent');
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

  researchIdeasCache = { data: created, timestamp: Date.now() };
  return created;
}
