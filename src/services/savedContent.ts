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
  hook_template: string | null;
  storytelling_framework: string | null;
  outlier_score: number;
  tags: string[] | null;
  performance_estimate: string;
  status: string;
  used_as_idea: boolean;
  project_folder: string;
  created_at: string;
}

export interface WatchAccount {
  id: string;
  username: string;
  platform: string;
  niche_relevance: string | null;
  notes: string | null;
  last_scraped: string | null;
  created_at: string;
}

export interface HookTemplate {
  id: string;
  template_text: string;
  category: string | null;
  example: string | null;
  performance_score: number;
  times_used: number;
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
  projectFolder?: string;
}): Promise<SavedContent> {
  const { url, creatorName, platform, rawInput, projectFolder } = params;

  const userMsg = `Analysiere:
URL: ${url || 'nicht angegeben'}
Creator: ${creatorName || 'nicht angegeben'}
Plattform: ${platform}
Caption/Text: ${rawInput || 'nicht angegeben'}

JSON:
{
  "hook_text": "Original-Hook des Videos (1 Satz)",
  "video_format": "Talking Head / B-Roll / Text-Overlay / POV / Storytime / Listicle",
  "why_it_works": "Warum performt das? Psychologischer Trigger + Formatgrund. Max 2 Saetze.",
  "hook_template": "Welches abstrakte Hook-Template steckt dahinter? Z.B.: Du bist nicht [X], du hast [Y].",
  "storytelling_framework": "Problem-Agitate-Solve / Identitaets-Reframe / Kontrast / Mythos-brechen / Personal Story / Zahlen-Schock",
  "niche_adaptation": "Wie adaptiert Joshua diesen Content fuer H.I.S./DCI? 2-3 Saetze konkret.",
  "adapted_hook": "Fertiger Hook fuer Joshs Video. Direkt verwendbar. Max 15 Woerter.",
  "outlier_score": Zahl 1-100 wie viral-tauglich das Konzept fuer Joshs Nische ist,
  "tags": ["tag1","tag2","tag3"],
  "performance_estimate": "hoch oder mittel oder niedrig"
}`;

  const raw = await callClaude(RESEARCH_SYSTEM_PROMPT, userMsg, CLAUDE_MODELS.SONNET, 1000, 'Content Research Agent');
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
      hook_template: parsed.hook_template as string,
      storytelling_framework: parsed.storytelling_framework as string,
      outlier_score: (parsed.outlier_score as number) || 0,
      tags: (parsed.tags as string[]) || [],
      performance_estimate: (parsed.performance_estimate as string) || 'mittel',
      project_folder: projectFolder || 'Allgemein',
    })
    .select()
    .maybeSingle();

  if (error || !data) throw new Error('Fehler beim Speichern der Analyse.');
  return data as SavedContent;
}

export async function getAllSavedContent(folder?: string): Promise<SavedContent[]> {
  let q = supabase.from('saved_content').select('*').order('created_at', { ascending: false });
  if (folder && folder !== 'Alle') q = q.eq('project_folder', folder);
  const { data } = await q;
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

export async function addWatchAccount(params: {
  username: string;
  platform: string;
  nicheRelevance: string;
  notes: string;
}): Promise<WatchAccount> {
  const { data, error } = await supabase
    .from('watch_accounts')
    .insert({
      username: params.username,
      platform: params.platform,
      niche_relevance: params.nicheRelevance || null,
      notes: params.notes || null,
    })
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

export async function getAllHookTemplates(): Promise<HookTemplate[]> {
  const { data } = await supabase
    .from('hook_templates')
    .select('*')
    .order('performance_score', { ascending: false });
  return (data || []) as HookTemplate[];
}

export async function addHookTemplate(params: {
  templateText: string;
  category: string;
  example: string;
}): Promise<HookTemplate> {
  const { data, error } = await supabase
    .from('hook_templates')
    .insert({ template_text: params.templateText, category: params.category || null, example: params.example || null })
    .select()
    .maybeSingle();
  if (error || !data) throw new Error('Fehler beim Speichern des Templates.');
  return data as HookTemplate;
}

export async function incrementTemplateUsage(id: string): Promise<void> {
  const { data } = await supabase.from('hook_templates').select('times_used').eq('id', id).maybeSingle();
  if (data) {
    await supabase.from('hook_templates').update({ times_used: (data.times_used || 0) + 1 }).eq('id', id);
  }
}

export async function extractTemplatesFromDatabase(): Promise<HookTemplate[]> {
  const { data } = await supabase
    .from('saved_content')
    .select('adapted_hook, hook_template, storytelling_framework')
    .not('adapted_hook', 'is', null)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!data || data.length === 0) throw new Error('Keine Eintraege in der Datenbank.');

  const list = data
    .map((r) => `Hook: ${r.adapted_hook} | Template: ${r.hook_template || 'unbekannt'}`)
    .join('\n');

  const raw = await callClaude(
    'Du bist ein Hook-Stratege. Extrahiere abstrakte, wiederverwendbare Hook-Templates. Antworte NUR als valides JSON Array ohne Backticks.',
    `Extrahiere 3 neue abstrakte Hook-Templates aus diesen analysierten Hooks:\n${list}\n\nJSON Array: [{"template_text": "...", "category": "...", "example": "..."}]`,
    CLAUDE_MODELS.HAIKU,
    400,
    'Content Research Agent'
  );

  let parsed: Array<{ template_text: string; category: string; example: string }>;
  try {
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    throw new Error('Template-Extraktion fehlgeschlagen.');
  }

  const results: HookTemplate[] = [];
  for (const t of parsed) {
    try {
      const saved = await addHookTemplate({ templateText: t.template_text, category: t.category, example: t.example });
      results.push(saved);
    } catch {}
  }
  return results;
}

export async function generateHookFromTemplate(templateText: string, thema: string): Promise<string> {
  const raw = await callClaude(
    'Du bist ein Hook-Texter fuer Joshua Tischer. Antworte nur mit dem fertigen Hook, keine Erklaerung.',
    `Fuelle dieses Hook-Template fuer das Thema "${thema}" aus: ${templateText}`,
    CLAUDE_MODELS.HAIKU,
    200,
    'Content Research Agent'
  );
  return raw.replace(/```/g, '').trim();
}
