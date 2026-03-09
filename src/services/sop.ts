// SOP service: CRUD for SOP documents in Supabase
import { supabase } from '../lib/supabase';
import type { SopDocument, SopCategory } from '../types';

export async function getAllSops(): Promise<SopDocument[]> {
  const { data } = await supabase
    .from('sop_documents')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as SopDocument[];
}

export async function createSop(sop: {
  title: string;
  category: SopCategory;
  description: string;
}): Promise<SopDocument | null> {
  const { data } = await supabase
    .from('sop_documents')
    .insert(sop)
    .select()
    .maybeSingle();
  return data as SopDocument | null;
}

export async function updateSop(
  id: string,
  updates: Partial<Pick<SopDocument, 'title' | 'category' | 'description'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('sop_documents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function deleteSop(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('sop_documents')
    .delete()
    .eq('id', id);
  return !error;
}
