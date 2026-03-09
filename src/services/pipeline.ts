// Pipeline service: CRUD for Kanban pipeline cards in Supabase
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
