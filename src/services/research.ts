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

  const systemPrompt = `Du bist Joshua Tischer's Content Research Agent. Analysiere seine Top-Posts und generiere 6 neue Reel-Ideen die auf denselben psychologischen Mustern basieren. JSON format: [{"title": "...", "hook_type": "...", "platform": "instagram", "reason": "..."}] wobei reason erklaert warum diese Idee basierend auf seinen Top-Posts funktionieren wird. Hook-Typen: Identitaet, Frage, Zahlen, Kontrast, Statement. Antworte NUR als JSON array.`;

  const userMessage = postsContext
    ? `Top performing posts von @joshmanky:\n${postsContext}\n\nGeneriere 6 neue Video-Ideen die auf denselben psychologischen Mustern basieren. Erklaere bei jeder Idee WARUM sie funktionieren wird.`
    : `Generiere 6 Video-Ideen fuer Instagram Reels in den Nischen: Network Marketing, Mindset, Financial Freedom, Trading, Personal Development. Erklaere bei jeder Idee den psychologischen Grund.`;

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
