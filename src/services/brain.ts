// Brain service: upload documents, extract insights, search content, save transcripts
// Updated: added saveTranscript for video_transcript type; 30min cache for generateContentFromBrain
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import type { BrainDocument } from '../types';

const CACHE_TTL = 30 * 60 * 1000;
let brainContentCache: { data: string; timestamp: number } | null = null;

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
      'Extrahiere 5 Zitate und 3 Insights. Antworte NUR als JSON: {"quotes":["..."],"insights":["..."]}',
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
    'Wissens-Assistent. Beantworte die Frage praezise anhand des Contents, zitiere relevante Stellen. Deutsch.',
    `Frage: ${query}\n\nContent:\n${context.slice(0, 12000)}`
  );
  await logAiTask('Brain Search Agent', 'brain_search', result);

  return result;
}

export async function generateContentFromBrain(): Promise<string> {
  if (brainContentCache && Date.now() - brainContentCache.timestamp < CACHE_TTL) {
    return brainContentCache.data;
  }

  const { data: docs } = await supabase
    .from('brain_documents')
    .select('filename, extracted_quotes, extracted_insights');

  if (!docs || docs.length === 0) return 'Keine Dokumente im Brain gefunden.';

  const allQuotes = docs.flatMap((d) => (d.extracted_quotes as string[]) || []);
  const allInsights = docs.flatMap((d) => (d.extracted_insights as string[]) || []);

  const result = await callClaude(
    'Content-Stratege. Schlage 5 virale Video-Ideen vor (Titel, Hook-Typ, Beschreibung) basierend auf den Zitaten und Insights. Deutsch.',
    `Zitate:\n${allQuotes.join('\n')}\n\nInsights:\n${allInsights.join('\n')}`
  );
  await logAiTask('Brain Content Agent', 'brain_content_generation', result);

  brainContentCache = { data: result, timestamp: Date.now() };
  return result;
}

export async function saveTranscript(
  title: string,
  text: string
): Promise<BrainDocument | null> {
  let quotes: string[] = [];
  let insights: string[] = [];

  try {
    const extractResult = await callClaude(
      'Extrahiere 5 Zitate und 3 Insights aus dem Video-Transkript. Antworte NUR als JSON: {"quotes":["..."],"insights":["..."]}',
      text.slice(0, 8000)
    );
    await logAiTask('Brain Extract Agent', 'transcript_extraction', extractResult);
    const parsed = JSON.parse(extractResult.replace(/```json?\n?/g, '').replace(/```/g, '').trim());
    quotes = parsed.quotes || [];
    insights = parsed.insights || [];
  } catch {
    quotes = [];
    insights = ['Extraktion nicht moeglich'];
  }

  const { data } = await supabase
    .from('brain_documents')
    .insert({
      filename: title || 'Video Transkript',
      category: 'Video Transkript',
      file_path: '',
      extracted_quotes: quotes,
      extracted_insights: insights,
      full_text: text.slice(0, 50000),
      type: 'video_transcript',
    })
    .select()
    .maybeSingle();

  return data as BrainDocument | null;
}
