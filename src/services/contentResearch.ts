// Content Research service: CRUD for research items + AI idea generation
// Updated: 30min in-memory cache for generateAiIdeas, compressed system prompt
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import type { ContentResearchItem, ResearchStatus } from '../types';

const CACHE_TTL = 30 * 60 * 1000;
let aiIdeasCache: { data: ContentResearchItem[]; timestamp: number } | null = null;

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
  if (aiIdeasCache && Date.now() - aiIdeasCache.timestamp < CACHE_TTL) {
    return aiIdeasCache.data;
  }

  const { data: topPosts } = await supabase
    .from('instagram_posts')
    .select('caption, like_count, media_type')
    .order('like_count', { ascending: false })
    .limit(5);

  const postsContext = (topPosts || [])
    .map((p, i) => `${i + 1}. "${p.caption?.slice(0, 120)}" (${p.like_count} Likes, ${p.media_type})`)
    .join('\n');

  const systemPrompt = `Content-Stratege fuer H.I.S.-Methode, Anti-Guru Blockadenloesung, Network Marketing, Trading. Generiere 5 virale Video-Ideen. Antworte NUR als JSON: [{"topic":"max 80 Zeichen","hook_suggestion":"konkreter Hook-Satz","platform":"instagram|tiktok|youtube"}]`;

  const userMessage = postsContext
    ? `Basierend auf diesen Top-5 Instagram Posts:\n${postsContext}\n\nGeneriere 5 frische, virale Video-Ideen die auf diesen Erfolgen aufbauen.`
    : `Generiere 5 frische, virale Video-Ideen fuer die Nischen Network Marketing, Mindset, Financial Freedom, Trading und Personal Development.`;

  const raw = await callClaude(systemPrompt, userMessage, undefined, undefined, 'Content Research Agent');
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

  aiIdeasCache = { data: created, timestamp: Date.now() };
  return created;
}
