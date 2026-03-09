// Agents service: fetch AI task logs from Supabase + static agent registry
import { supabase } from '../lib/supabase';
import type { AiTaskLog, AgentInfo } from '../types';

export const AGENT_REGISTRY: AgentInfo[] = [
  {
    name: 'Instagram Analytics Agent',
    role: 'Analysiert Instagram-Daten und erkennt Trends in Reichweite und Engagement.',
    status: 'Active',
    lastTask: 'Instagram-Daten synchronisiert',
  },
  {
    name: 'TikTok Analytics Agent',
    role: 'Ueberwacht TikTok-Performance und identifiziert virale Muster.',
    status: 'Active',
    lastTask: 'TikTok-Videos analysiert',
  },
  {
    name: 'YouTube Analytics Agent',
    role: 'Trackt YouTube-Metriken und optimiert Video-Strategien.',
    status: 'Active',
    lastTask: 'YouTube-Kanal aktualisiert',
  },
  {
    name: 'Script Generation Agent',
    role: 'Erstellt virale Skripte im 5-Phasen-Format fuer Reels und Shorts.',
    status: 'Active',
    lastTask: 'Skript fuer Reel generiert',
  },
  {
    name: 'Knowledge Brain Agent',
    role: 'Verwaltet das Wissenssystem und extrahiert Insights aus Dokumenten.',
    status: 'Active',
    lastTask: 'Dokument verarbeitet',
  },
  {
    name: 'Content Research Agent',
    role: 'Recherchiert Trending Topics und generiert Content-Ideen.',
    status: 'Active',
    lastTask: 'Ideen generiert',
  },
  {
    name: 'Sales Conversation Agent',
    role: 'Unterstuetzt bei DM-Verkaufsgespraechen und Follow-up-Strategien.',
    status: 'Building',
    lastTask: 'In Entwicklung',
  },
  {
    name: 'Performance Monitor Agent',
    role: 'Ueberwacht alle Plattformen und sendet Alerts bei Anomalien.',
    status: 'Standby',
    lastTask: 'Warte auf Konfiguration',
  },
];

export async function getAiTaskLogs(): Promise<AiTaskLog[]> {
  const { data } = await supabase
    .from('ai_tasks_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return (data || []) as AiTaskLog[];
}
