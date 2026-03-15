// CEO Agent service: analyses performance data, optimizes agents, gives NAECHSTER_POST recommendation
// Updated: added nextPostRecommendation to CeoAnalysis, updated prompt for optimization loop
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask, cleanSummary, CLAUDE_MODELS } from './claude';
import { AGENT_REGISTRY } from './agents';
import { getRecentPublished } from './pipeline';

export interface NextPostRecommendation {
  hook_type: string;
  platform: string;
  thema: string;
}

export interface CeoAnalysis {
  performanceSummary: string;
  agentOptimizations: AgentOptimization[];
  contentPriorities: string[];
  nextPostRecommendation?: NextPostRecommendation;
  generatedAt: string;
}

export interface AgentOptimization {
  agentName: string;
  reason: string;
  suggestedPromptUpdate: string;
}

export async function loadCachedCeoAnalysis(): Promise<CeoAnalysis | null> {
  const { data } = await supabase
    .from('ceo_analysis_cache')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  const opts = (data.agent_optimizations || []) as AgentOptimization[];
  const priorities = (data.content_priorities || []) as string[];

  let nextPost: NextPostRecommendation | undefined;
  const lastPriority = priorities.find((p) => p.startsWith('NAECHSTER_POST:'));
  if (lastPriority) {
    try {
      const json = lastPriority.replace('NAECHSTER_POST:', '').trim();
      nextPost = JSON.parse(json);
    } catch {}
  }

  return {
    performanceSummary: data.performance_summary,
    agentOptimizations: opts,
    contentPriorities: priorities.filter((p) => !p.startsWith('NAECHSTER_POST:')),
    nextPostRecommendation: nextPost,
    generatedAt: data.created_at,
  };
}

export async function runCeoAnalysis(model: string = CLAUDE_MODELS.SONNET): Promise<CeoAnalysis> {
  const [taskLogs, igPosts, tiktokVideos, ytVideos, publishedCards] = await Promise.all([
    supabase.from('ai_tasks_log').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('instagram_posts').select('caption, like_count, media_type').order('like_count', { ascending: false }).limit(10),
    supabase.from('tiktok_videos').select('description, views, likes').order('likes', { ascending: false }).limit(10),
    supabase.from('youtube_videos').select('title, views, likes').order('views', { ascending: false }).limit(10),
    getRecentPublished(20),
  ]);

  const igContext = (igPosts.data || [])
    .map((p, i) => `IG #${i + 1}: "${(p.caption || '').slice(0, 80)}" — ${p.like_count} Likes (${p.media_type})`)
    .join('\n');

  const ttContext = (tiktokVideos.data || [])
    .map((v, i) => `TT #${i + 1}: "${(v.description || '').slice(0, 80)}" — ${v.views} Views, ${v.likes} Likes`)
    .join('\n');

  const ytContext = (ytVideos.data || [])
    .map((v, i) => `YT #${i + 1}: "${(v.title || '').slice(0, 80)}" — ${v.views} Views, ${v.likes} Likes`)
    .join('\n');

  const taskContext = (taskLogs.data || [])
    .slice(0, 20)
    .map(t => `[${t.agent_name}] ${t.task_type}: "${t.output_summary}"`)
    .join('\n');

  const sortedByLikes = [...publishedCards].sort((a, b) => (b.likes_48h || 0) - (a.likes_48h || 0));
  const top3 = sortedByLikes.slice(0, 3);
  const bottom3 = sortedByLikes.slice(-3).reverse();

  const formatPipelineCard = (c: typeof publishedCards[0], i: number) => {
    const plat = c.platform === 'instagram' ? 'IG' : c.platform === 'tiktok' ? 'TT' : 'YT';
    return `#${i + 1} [${plat}] "${c.title}" — Hook: ${c.hook_type}, Views48h: ${c.views_48h || 0}, Likes48h: ${c.likes_48h || 0}, Watchtime: ${c.watchtime_score || 0}`;
  };

  const pipelineTopContext = top3.length > 0
    ? top3.map((c, i) => formatPipelineCard(c, i)).join('\n')
    : 'Keine Daten';

  const pipelineBottomContext = bottom3.length > 0
    ? bottom3.map((c, i) => formatPipelineCard(c, i)).join('\n')
    : 'Keine Daten';

  const hookTypeStats: Record<string, { count: number; totalLikes: number }> = {};
  publishedCards.forEach((c) => {
    const ht = c.hook_type || 'unbekannt';
    if (!hookTypeStats[ht]) hookTypeStats[ht] = { count: 0, totalLikes: 0 };
    hookTypeStats[ht].count++;
    hookTypeStats[ht].totalLikes += c.likes_48h || 0;
  });
  const hookAnalysis = Object.entries(hookTypeStats)
    .map(([ht, s]) => `${ht}: ${s.count}x, Avg Likes: ${Math.round(s.totalLikes / s.count)}`)
    .join('\n');

  const perfJson = publishedCards
    .filter((c) => c.likes_48h > 0)
    .map((c) => ({ hook_type: c.hook_type, platform: c.platform, likes_48h: c.likes_48h, views_48h: c.views_48h, watchtime_score: c.watchtime_score }));

  const agentNames = AGENT_REGISTRY.map(a => a.name).join(', ');

  const CEO_SYSTEM_PROMPT = `Du bist der CEO Agent fuer Joshua Tischer (@joshmanky). Nische: H.I.S.-Methode, Anti-Guru Blockadenloesung fuer 20-30-Jaehrige, DreamChasers Industry.

Analysiere Performance-Daten inkl. Pipeline-Performance (Views, Likes, Watchtime, Hook-Typen), optimiere Agents (${agentNames}) und setze Content-Prioritaeten.

Analysiere welche Hook-Typen auf welchen Plattformen die beste Performance zeigen.

Aktuelle Post-Performance: ${JSON.stringify(perfJson)}

Gib am Ende deiner Analyse eine konkrete Empfehlung als letztes Element in contentPriorities:
"NAECHSTER_POST:{"hook_type":"...","platform":"instagram|tiktok|youtube","thema":"konkretes Thema"}"

Antworte NUR als JSON:
{"performanceSummary":"...","agentOptimizations":[{"agentName":"...","reason":"...","suggestedPromptUpdate":"..."}],"contentPriorities":["...","...","NAECHSTER_POST:{...}"]}`;

  const userMessage = `TOP INSTAGRAM POSTS:\n${igContext || 'Keine Daten'}\n\nTOP TIKTOK VIDEOS:\n${ttContext || 'Keine Daten'}\n\nTOP YOUTUBE VIDEOS:\n${ytContext || 'Keine Daten'}\n\nPIPELINE TOP 3 (nach Likes48h):\n${pipelineTopContext}\n\nPIPELINE BOTTOM 3 (nach Likes48h):\n${pipelineBottomContext}\n\nHOOK-TYP ANALYSE:\n${hookAnalysis || 'Keine Daten'}\n\nREZENTE AI TASKS:\n${taskContext || 'Keine Logs'}`;

  const raw = await callClaude(CEO_SYSTEM_PROMPT, userMessage, model, 800, 'CEO Agent');
  await logAiTask('CEO Agent', 'agent_optimization_analysis', raw);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]) as CeoAnalysis;
    parsed.generatedAt = new Date().toISOString();

    const priorities = parsed.contentPriorities || [];
    const nextPostEntry = priorities.find((p) => p.startsWith('NAECHSTER_POST:'));
    if (nextPostEntry) {
      try {
        const json = nextPostEntry.replace('NAECHSTER_POST:', '').trim();
        parsed.nextPostRecommendation = JSON.parse(json);
      } catch {}
      parsed.contentPriorities = priorities.filter((p) => !p.startsWith('NAECHSTER_POST:'));
    }

    await Promise.all([
      supabase.from('ai_tasks_log').insert({
        agent_name: 'CEO Agent',
        task_type: 'full_system_optimization',
        output_summary: cleanSummary(parsed.performanceSummary),
        status: 'completed',
      }),
      supabase.from('ceo_analysis_cache').insert({
        performance_summary: parsed.performanceSummary,
        agent_optimizations: parsed.agentOptimizations,
        content_priorities: [...(parsed.contentPriorities || []), ...(nextPostEntry ? [nextPostEntry] : [])],
        source: 'manual',
        model_used: model,
      }),
    ]);

    return parsed;
  } catch {
    return {
      performanceSummary: 'Analyse konnte nicht geparst werden. Mehr Daten benoetigt.',
      agentOptimizations: [],
      contentPriorities: [
        'Mehr Content posten um Daten zu sammeln',
        'TikTok und Instagram taeglich bespielen',
        'YouTube als Mutter-Content nutzen',
      ],
      generatedAt: new Date().toISOString(),
    };
  }
}
