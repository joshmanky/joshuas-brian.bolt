// Attribution service: CRUD for attributions in Supabase
import { supabase } from '../lib/supabase';
import type { Attribution } from '../types';

export async function getAllAttributions(): Promise<Attribution[]> {
  const { data } = await supabase
    .from('attributions')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as Attribution[];
}

export async function createAttribution(item: {
  lead_name: string;
  channel: string;
  content_title?: string;
  revenue: number;
  date: string;
  notes?: string;
}): Promise<Attribution | null> {
  const { data } = await supabase
    .from('attributions')
    .insert({
      lead_name: item.lead_name,
      channel: item.channel,
      content_title: item.content_title || '',
      revenue: item.revenue,
      date: item.date,
      notes: item.notes || '',
    })
    .select()
    .maybeSingle();
  return data as Attribution | null;
}

export async function deleteAttribution(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('attributions')
    .delete()
    .eq('id', id);
  return !error;
}
