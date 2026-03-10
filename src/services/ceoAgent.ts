// CEO Agent service: analyses all performance data and optimizes agent prompts
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from './claude';
import { AGENT_REGISTRY } from './agents';

export interface CeoAnalysis {
  performanceSummary: string;
  agentOptimizations: AgentOptimization[];
  contentPriorities: string[];
  generatedAt: string;
}

export interface AgentOptimization {
  agentName: string;
  reason: string;
  suggestedPromptUpdate: string;
}

export async function runCeoAnalysis(): Promise<CeoAnalysis> {
  const [taskLogs, igPosts, tiktokVideos, ytVideos] = await Promise.all([
    supabase.from('ai_tasks_log').select('*').order('created_at', { ascending: false }).limit(50),
    supabase.from('instagram_posts').select('caption, like_count, media_type').order('like_count', { ascending: false }).limit(10),
    supabase.from('tiktok_videos').select('description, views, likes').order('likes', { ascending: false }).limit(10),
    supabase.from('youtube_videos').select('title, views, likes').order('views', { ascending: false }).limit(10),
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

  const agentNames = AGENT_REGISTRY.map(a => a.name).join(', ');

  const CEO_SYSTEM_PROMPT = `Du bist Joshua Tischer's CEO Agent. Seine Nische: Psychologische Blockadenloesung fuer "innerlich festgefahrene Potenzialtraeger" (20-30 Jahre). H.I.S.-Methode als System. Network Marketing + Trading als Vehikel. Anti-Guru Positionierung.

Analysiere die Performance-Daten und AI Task Logs. Triff dann eigenstaendige Entscheidungen welche Agents optimiert werden sollen.

Verfuegbare Agents: ${agentNames}

Antworte als JSON:
{
  "performanceSummary": "2-3 Saetze was die Daten zeigen",
  "agentOptimizations": [
    {
      "agentName": "Name des Agents",
      "reason": "Warum dieser Agent optimiert werden soll (mit Datenbezug)",
      "suggestedPromptUpdate": "Der spezifische Teil des Prompts der sich aendern soll"
    }
  ],
  "contentPriorities": [
    "Prioritaet 1 diese Woche (konkret, mit Datenbezug)",
    "Prioritaet 2 diese Woche",
    "Prioritaet 3 diese Woche"
  ]
}

Nur JSON. Keine anderen Texte.`;

  const userMessage = `TOP INSTAGRAM POSTS:\n${igContext || 'Keine Daten'}\n\nTOP TIKTOK VIDEOS:\n${ttContext || 'Keine Daten'}\n\nTOP YOUTUBE VIDEOS:\n${ytContext || 'Keine Daten'}\n\nREZENTE AI TASKS:\n${taskContext || 'Keine Logs'}`;

  const raw = await callClaude(CEO_SYSTEM_PROMPT, userMessage);
  await logAiTask('CEO Agent', 'agent_optimization_analysis', raw);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]) as CeoAnalysis;
    parsed.generatedAt = new Date().toISOString();

    await supabase.from('ai_tasks_log').insert({
      agent_name: 'CEO Agent',
      task_type: 'full_system_optimization',
      output_summary: parsed.performanceSummary.slice(0, 100),
      status: 'completed',
    });

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
