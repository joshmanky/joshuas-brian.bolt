// Content Research service: CRUD for research items + AI idea generation — added AI task logging
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import type { ContentResearchItem, ResearchStatus } from '../types';

export async function getAllResearchItems(): Promise<ContentResearchItem[]> {
  const { data } = await supabase
    .from('content_research_items')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as ContentResearchItem[];
}

export async function createResearchItem(item: {
  topic: string;
  hook_suggestion?: string;
  platform?: string;
  source?: string;
}): Promise<ContentResearchItem | null> {
  const { data } = await supabase
    .from('content_research_items')
    .insert({
      topic: item.topic,
      hook_suggestion: item.hook_suggestion || '',
      platform: item.platform || 'instagram',
      source: item.source || 'manual',
      status: 'New',
    })
    .select()
    .maybeSingle();
  return data as ContentResearchItem | null;
}

export async function updateResearchStatus(
  id: string,
  status: ResearchStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('content_research_items')
    .update({ status })
    .eq('id', id);
  return !error;
}

export async function deleteResearchItem(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('content_research_items')
    .delete()
    .eq('id', id);
  return !error;
}

export async function generateAiIdeas(): Promise<ContentResearchItem[]> {
  const { data: topPosts } = await supabase
    .from('instagram_posts')
    .select('caption, like_count, media_type')
    .order('like_count', { ascending: false })
    .limit(5);

  const postsContext = (topPosts || [])
    .map((p, i) => `${i + 1}. "${p.caption?.slice(0, 120)}" (${p.like_count} Likes, ${p.media_type})`)
    .join('\n');

  const systemPrompt = `Du bist ein Content-Stratege fuer Social Media in den Nischen: Network Marketing, Mindset, Financial Freedom, Trading, Personal Development. Antworte NUR mit einem JSON-Array von genau 5 Objekten. Jedes Objekt hat: "topic" (string, max 80 Zeichen), "hook_suggestion" (string, ein konkreter Hook-Satz), "platform" (einer von: "instagram", "tiktok", "youtube"). Keine Erklaerungen, kein Markdown, nur valides JSON.`;

  const userMessage = postsContext
    ? `Basierend auf diesen Top-5 Instagram Posts:\n${postsContext}\n\nGeneriere 5 frische, virale Video-Ideen die auf diesen Erfolgen aufbauen.`
    : `Generiere 5 frische, virale Video-Ideen fuer die Nischen Network Marketing, Mindset, Financial Freedom, Trading und Personal Development.`;

  const raw = await callClaude(systemPrompt, userMessage);
  await logAiTask('Content Research Agent', 'content_research_generation', raw);

  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const ideas = JSON.parse(jsonMatch[0]) as {
    topic: string;
    hook_suggestion: string;
    platform: string;
  }[];

  const created: ContentResearchItem[] = [];
  for (const idea of ideas) {
    const item = await createResearchItem({
      topic: idea.topic,
      hook_suggestion: idea.hook_suggestion,
      platform: idea.platform,
      source: 'ai_generated',
    });
    if (item) created.push(item);
  }

  return created;
}
