// Pipeline service: CRUD for Kanban pipeline cards in Supabase
// Updated: createCard accepts caption, hashtags, canva_design_url, scheduled_date; added getScheduledForToday
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
