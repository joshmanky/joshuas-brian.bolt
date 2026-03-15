// Pipeline service: CRUD for Kanban pipeline cards in Supabase
// Updated: added getWeeklyPerformanceStats for Command Center performance section
import { supabase } from '../lib/supabase';
import type { PipelineCard, PipelineStatus } from '../types';

export async function getAllCards(): Promise<PipelineCard[]> {
  const { data } = await supabase
    .from('pipeline_cards')
    .select('*')
    .order('position', { ascending: true });
  return (data || []) as PipelineCard[];
}

export async function createCard(card: {
  title: string;
  platform: string;
  hook_type: string;
  status?: PipelineStatus;
  script_content?: string;
  caption?: string;
  hashtags?: string;
  canva_design_url?: string;
  scheduled_date?: string;
  media_id?: string;
}): Promise<PipelineCard | null> {
  const { count } = await supabase
    .from('pipeline_cards')
    .select('id', { count: 'exact', head: true })
    .eq('status', card.status || 'idee');

  const { data } = await supabase
    .from('pipeline_cards')
    .insert({ ...card, position: count || 0 })
    .select()
    .maybeSingle();
  return data as PipelineCard | null;
}

export async function updateCard(id: string, updates: Partial<PipelineCard>): Promise<boolean> {
  const { error } = await supabase
    .from('pipeline_cards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteCard(id: string): Promise<boolean> {
  const { error } = await supabase.from('pipeline_cards').delete().eq('id', id);
  return !error;
}

export async function moveCard(id: string, newStatus: PipelineStatus, newPosition: number): Promise<boolean> {
  const { error } = await supabase
    .from('pipeline_cards')
    .update({ status: newStatus, position: newPosition, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function getScheduledForToday(): Promise<PipelineCard[]> {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { data } = await supabase
    .from('pipeline_cards')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_date', start)
    .lt('scheduled_date', end)
    .order('scheduled_date', { ascending: true });
  return (data || []) as PipelineCard[];
}

export async function getPublishedToday(): Promise<number> {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

  const { count } = await supabase
    .from('pipeline_cards')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')
    .gte('updated_at', start);
  return count || 0;
}

export async function getTopPerformingCards(limit: number = 3): Promise<PipelineCard[]> {
  const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabase
    .from('pipeline_cards')
    .select('*')
    .eq('status', 'published')
    .gte('updated_at', oneWeekAgo)
    .order('likes_48h', { ascending: false })
    .limit(limit);
  return (data || []) as PipelineCard[];
}

export async function getRecentPublished(limit: number = 20): Promise<PipelineCard[]> {
  const { data } = await supabase
    .from('pipeline_cards')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false })
    .limit(limit);
  return (data || []) as PipelineCard[];
}

export interface WeeklyStats {
  avgLikes: number;
  bestPost: PipelineCard | null;
  worstPost: PipelineCard | null;
  trendBetter: boolean | null;
  thisWeekCount: number;
  lastWeekAvgLikes: number;
}

export async function getWeeklyPerformanceStats(): Promise<WeeklyStats> {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1).toISOString();
  const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() - 6).toISOString();

  const { data: thisWeek } = await supabase
    .from('pipeline_cards')
    .select('*')
    .eq('status', 'published')
    .not('likes_48h', 'is', null)
    .gte('updated_at', weekStart)
    .order('likes_48h', { ascending: false });

  const { data: lastWeek } = await supabase
    .from('pipeline_cards')
    .select('likes_48h')
    .eq('status', 'published')
    .not('likes_48h', 'is', null)
    .gte('updated_at', lastWeekStart)
    .lt('updated_at', weekStart);

  const cards = (thisWeek || []) as PipelineCard[];
  const withPerf = cards.filter((c) => c.likes_48h > 0);
  const avgLikes = withPerf.length > 0
    ? Math.round(withPerf.reduce((s, c) => s + c.likes_48h, 0) / withPerf.length)
    : 0;

  const bestPost = withPerf.length > 0 ? withPerf[0] : null;
  const worstPost = withPerf.length > 1 ? withPerf[withPerf.length - 1] : null;

  const lastWeekCards = (lastWeek || []).filter((c) => (c.likes_48h || 0) > 0);
  const lastWeekAvgLikes = lastWeekCards.length > 0
    ? Math.round(lastWeekCards.reduce((s, c) => s + (c.likes_48h || 0), 0) / lastWeekCards.length)
    : 0;

  const trendBetter = lastWeekAvgLikes > 0 ? avgLikes > lastWeekAvgLikes : null;

  return { avgLikes, bestPost, worstPost, trendBetter, thisWeekCount: withPerf.length, lastWeekAvgLikes };
}
