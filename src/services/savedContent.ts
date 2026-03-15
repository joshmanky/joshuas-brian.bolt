// Saved Content service: link-based research hub — analyze URLs, store insights, Apify TikTok scraping
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask, CLAUDE_MODELS } from './claude';
import { getApiKey } from './apiKeys';

export interface SavedContent {
  id: string;
  source_url: string | null;
  source_platform: string;
  creator_name: string | null;
  raw_input: string | null;
  hook_text: string | null;
  video_format: string | null;
  why_it_works: string | null;
  niche_adaptation: string | null;
  adapted_hook: string | null;
  tags: string[] | null;
  performance_estimate: string;
  status: string;
  used_as_idea: boolean;
  created_at: string;
}

export interface WatchAccount {
  id: string;
  username: string;
  platform: string;
  notes: string | null;
  last_scraped: string | null;
  created_at: string;
}

const RESEARCH_SYSTEM_PROMPT = `Du bist der Content Research Agent fuer Joshua Tischer (DreamChasers Industry, H.I.S.-Methode).
Joshua positioniert sich als Anti-Guru fuer 20-35 Jaehrige in DACH die aus dem 9-to-5 wollen.
Niemals 'Network Marketing' schreiben - stattdessen: Community, Skills, Freiheit, System, H.I.S.
Analysiere fremden Social Media Content und adaptiere ihn praezise fuer Joshs Nische.
Antworte AUSSCHLIESSLICH als valides JSON ohne Backticks.`;

export async function analyzeContentLink(params: {
  url: string;
  creatorName: string;
  platform: string;
  rawInput: string;
}): Promise<SavedContent> {
  const { url, creatorName, platform, rawInput } = params;

  const userMsg = `Analysiere diesen Content:
URL: ${url || 'nicht angegeben'}
Creator: ${creatorName || 'nicht angegeben'}
Plattform: ${platform}
Caption/Text: ${rawInput || 'nicht angegeben'}

Erstelle JSON mit diesen Feldern:
{
  "hook_text": "Der originale Hook des Videos in einem praegnanten Satz",
  "video_format": "Talking Head oder B-Roll oder Text-Overlay oder POV oder Duett oder Sonstiges",
  "why_it_works": "Warum performt dieser Content gut? Max 2 Saetze, psychologisch praezise.",
  "niche_adaptation": "Wie wuerde Josh diesen Content fuer H.I.S./DCI adaptieren? Konkrete Beschreibung in 2-3 Saetzen.",
  "adapted_hook": "Der fertige Hook fuer Joshs Video. Direkt verwendbar, max 15 Woerter.",
  "tags": ["thema1", "thema2", "thema3"],
  "performance_estimate": "hoch oder mittel oder niedrig",
  "creator_style": "Kurze Beschreibung des Stils dieses Creators in 1 Satz"
}`;

  const raw = await callClaude(RESEARCH_SYSTEM_PROMPT, userMsg, CLAUDE_MODELS.SONNET, 800, 'Content Research Agent');
  await logAiTask('Content Research Agent', 'content_link_analysis', raw);

  let parsed: Record<string, unknown>;
  try {
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Analyse fehlgeschlagen. Bitte fuege die Caption manuell in das Textfeld ein.');
  }

  const { data, error } = await supabase
    .from('saved_content')
    .insert({
      source_url: url || null,
      source_platform: platform,
      creator_name: creatorName || null,
      raw_input: rawInput || null,
      hook_text: parsed.hook_text as string,
      video_format: parsed.video_format as string,
      why_it_works: parsed.why_it_works as string,
      niche_adaptation: parsed.niche_adaptation as string,
      adapted_hook: parsed.adapted_hook as string,
      tags: (parsed.tags as string[]) || [],
      performance_estimate: (parsed.performance_estimate as string) || 'mittel',
    })
    .select()
    .maybeSingle();

  if (error || !data) throw new Error('Fehler beim Speichern der Analyse.');
  return data as SavedContent;
}

export async function getAllSavedContent(): Promise<SavedContent[]> {
  const { data } = await supabase
    .from('saved_content')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as SavedContent[];
}

export async function markAsUsedIdea(id: string): Promise<void> {
  await supabase.from('saved_content').update({ used_as_idea: true }).eq('id', id);
}

export async function deleteSavedContent(id: string): Promise<void> {
  await supabase.from('saved_content').delete().eq('id', id);
}

export async function getSavedContentStats(): Promise<{
  total: number;
  today: number;
  usedAsIdea: number;
  highPerformance: number;
}> {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('saved_content').select('created_at, used_as_idea, performance_estimate');
  const all = data || [];
  return {
    total: all.length,
    today: all.filter((r) => (r.created_at as string)?.startsWith(todayStr)).length,
    usedAsIdea: all.filter((r) => r.used_as_idea).length,
    highPerformance: all.filter((r) => r.performance_estimate === 'hoch').length,
  };
}

export async function getResearchWeeklyStats(): Promise<{ analyzed: number; usedAsIdea: number }> {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const { data } = await supabase
    .from('saved_content')
    .select('used_as_idea, created_at')
    .gte('created_at', weekStart.toISOString());
  const all = data || [];
  return {
    analyzed: all.length,
    usedAsIdea: all.filter((r) => r.used_as_idea).length,
  };
}

export async function getAllWatchAccounts(): Promise<WatchAccount[]> {
  const { data } = await supabase
    .from('watch_accounts')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as WatchAccount[];
}

export async function addWatchAccount(params: { username: string; platform: string; notes: string }): Promise<WatchAccount> {
  const { data, error } = await supabase
    .from('watch_accounts')
    .insert({ username: params.username, platform: params.platform, notes: params.notes || null })
    .select()
    .maybeSingle();
  if (error || !data) throw new Error('Fehler beim Hinzufuegen des Accounts.');
  return data as WatchAccount;
}

export async function deleteWatchAccount(id: string): Promise<void> {
  await supabase.from('watch_accounts').delete().eq('id', id);
}

export async function scrapeTikTokAccount(
  account: WatchAccount,
  onProgress?: (msg: string) => void
): Promise<SavedContent[]> {
  const apifyKey = await getApiKey('apify');
  if (!apifyKey) throw new Error('Apify API Key nicht hinterlegt. Bitte in Settings eintragen.');

  onProgress?.('TikTok-Videos abrufen...');
  const username = account.username.replace('@', '');

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/clockworks~free-tiktok-scraper/run-sync-get-dataset-items?token=${apifyKey}&timeout=60`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profiles: [username], resultsPerPage: 5 }),
    }
  );

  if (!runRes.ok) {
    throw new Error(`Apify Fehler: ${runRes.status} ${runRes.statusText}`);
  }

  const videos = await runRes.json();
  if (!Array.isArray(videos) || videos.length === 0) {
    throw new Error('Keine Videos gefunden fuer diesen Account.');
  }

  const results: SavedContent[] = [];
  for (let i = 0; i < Math.min(5, videos.length); i++) {
    const v = videos[i] as Record<string, unknown>;
    const caption = (v.text || v.desc || v.description || '') as string;
    const videoUrl = (v.webVideoUrl || v.url || '') as string;
    onProgress?.(`Video ${i + 1}/${Math.min(5, videos.length)} analysieren...`);
    try {
      const saved = await analyzeContentLink({
        url: videoUrl,
        creatorName: `@${username}`,
        platform: 'tiktok',
        rawInput: caption,
      });
      results.push(saved);
    } catch {}
  }

  await supabase
    .from('watch_accounts')
    .update({ last_scraped: new Date().toISOString() })
    .eq('id', account.id);

  return results;
}
