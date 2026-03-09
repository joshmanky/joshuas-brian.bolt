// Brain service: upload documents, extract insights, search content — added AI task logging
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import type { BrainDocument } from '../types';

export async function getAllDocuments(): Promise<BrainDocument[]> {
  const { data } = await supabase
    .from('brain_documents')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as BrainDocument[];
}

export async function uploadDocument(
  file: File,
  category: string
): Promise<BrainDocument | null> {
  const filePath = `${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('brain-uploads')
    .upload(filePath, file);

  if (uploadError) throw new Error('Upload fehlgeschlagen: ' + uploadError.message);

  let fullText = '';
  if (file.name.endsWith('.txt')) {
    fullText = await file.text();
  } else {
    fullText = await file.text();
  }

  let quotes: string[] = [];
  let insights: string[] = [];

  try {
    const extractResult = await callClaude(
      'Du bist ein Content-Analyst. Extrahiere die 5 besten Zitate und 3 wichtigsten Insights aus dem folgenden Text. Antworte als JSON: {"quotes": ["..."], "insights": ["..."]}. Nur JSON, kein anderer Text.',
      fullText.slice(0, 8000)
    );
    await logAiTask('Brain Extract Agent', 'document_extraction', extractResult);
    const parsed = JSON.parse(extractResult.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
    quotes = parsed.quotes || [];
    insights = parsed.insights || [];
  } catch {
    quotes = [];
    insights = ['Extraktion nicht moeglich — Claude API pruefen'];
  }

  const { data } = await supabase
    .from('brain_documents')
    .insert({
      filename: file.name,
      category,
      file_path: filePath,
      extracted_quotes: quotes,
      extracted_insights: insights,
      full_text: fullText.slice(0, 50000),
    })
    .select()
    .maybeSingle();

  return data as BrainDocument | null;
}

export async function searchBrain(query: string): Promise<string> {
  const { data: docs } = await supabase
    .from('brain_documents')
    .select('filename, extracted_quotes, extracted_insights, full_text');

  if (!docs || docs.length === 0) return 'Keine Dokumente im Brain gefunden.';

  const context = docs
    .map((d) => `--- ${d.filename} ---\nZitate: ${JSON.stringify(d.extracted_quotes)}\nInsights: ${JSON.stringify(d.extracted_insights)}\nText (Auszug): ${(d.full_text || '').slice(0, 2000)}`)
    .join('\n\n');

  const result = await callClaude(
    'Du bist ein Wissens-Assistent. Durchsuche den folgenden Content und beantworte die Frage praezise. Zitiere relevante Stellen. Deutsch.',
    `Frage: ${query}\n\nContent:\n${context.slice(0, 12000)}`
  );
  await logAiTask('Brain Search Agent', 'brain_search', result);

  return result;
}

export async function generateContentFromBrain(): Promise<string> {
  const { data: docs } = await supabase
    .from('brain_documents')
    .select('filename, extracted_quotes, extracted_insights');

  if (!docs || docs.length === 0) return 'Keine Dokumente im Brain gefunden.';

  const allQuotes = docs.flatMap((d) => (d.extracted_quotes as string[]) || []);
  const allInsights = docs.flatMap((d) => (d.extracted_insights as string[]) || []);

  const result = await callClaude(
    'Du bist ein Content-Stratege. Basierend auf den folgenden Zitaten und Insights, schlage 5 virale Video-Ideen vor. Jede Idee mit Titel, Hook-Typ und kurzer Beschreibung. Deutsch.',
    `Zitate:\n${allQuotes.join('\n')}\n\nInsights:\n${allInsights.join('\n')}`
  );
  await logAiTask('Brain Content Agent', 'brain_content_generation', result);

  return result;
}
