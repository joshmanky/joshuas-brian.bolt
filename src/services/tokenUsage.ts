// Token usage service: queries token_usage_log for dashboard display
// Created: aggregation helpers for daily, agent-level, and model-level cost breakdowns
import { supabase } from '../lib/supabase';

export interface TokenUsageSummary {
  totalCostToday: number;
  totalCostWeek: number;
  totalCostMonth: number;
  totalCallsToday: number;
  totalCallsWeek: number;
  totalCallsMonth: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export interface AgentCostBreakdown {
  agent_name: string;
  call_count: number;
  total_input: number;
  total_output: number;
  total_cost: number;
}

export interface DailyCost {
  date: string;
  cost: number;
  calls: number;
}

export interface ModelBreakdown {
  model: string;
  call_count: number;
  total_cost: number;
}

export async function getTokenUsageSummary(): Promise<TokenUsageSummary> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: allMonth } = await supabase
    .from('token_usage_log')
    .select('input_tokens, output_tokens, estimated_cost, created_at')
    .gte('created_at', monthStart)
    .order('created_at', { ascending: false });

  const rows = allMonth || [];

  let totalCostToday = 0, totalCostWeek = 0, totalCostMonth = 0;
  let totalCallsToday = 0, totalCallsWeek = 0, totalCallsMonth = 0;
  let totalInputTokens = 0, totalOutputTokens = 0;

  for (const row of rows) {
    const cost = Number(row.estimated_cost) || 0;
    const inp = row.input_tokens || 0;
    const out = row.output_tokens || 0;

    totalCostMonth += cost;
    totalCallsMonth++;
    totalInputTokens += inp;
    totalOutputTokens += out;

    if (row.created_at >= weekStart) {
      totalCostWeek += cost;
      totalCallsWeek++;
    }
    if (row.created_at >= todayStart) {
      totalCostToday += cost;
      totalCallsToday++;
    }
  }

  return {
    totalCostToday,
    totalCostWeek,
    totalCostMonth,
    totalCallsToday,
    totalCallsWeek,
    totalCallsMonth,
    totalInputTokens,
    totalOutputTokens,
  };
}

export async function getAgentCostBreakdown(): Promise<AgentCostBreakdown[]> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data } = await supabase
    .from('token_usage_log')
    .select('agent_name, input_tokens, output_tokens, estimated_cost')
    .gte('created_at', monthStart);

  if (!data || data.length === 0) return [];

  const map = new Map<string, AgentCostBreakdown>();

  for (const row of data) {
    const existing = map.get(row.agent_name) || {
      agent_name: row.agent_name,
      call_count: 0,
      total_input: 0,
      total_output: 0,
      total_cost: 0,
    };
    existing.call_count++;
    existing.total_input += row.input_tokens || 0;
    existing.total_output += row.output_tokens || 0;
    existing.total_cost += Number(row.estimated_cost) || 0;
    map.set(row.agent_name, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.total_cost - a.total_cost);
}

export async function getDailyCosts(days: number = 7): Promise<DailyCost[]> {
  const start = new Date(Date.now() - days * 86400000).toISOString();

  const { data } = await supabase
    .from('token_usage_log')
    .select('estimated_cost, created_at')
    .gte('created_at', start)
    .order('created_at', { ascending: true });

  if (!data || data.length === 0) return [];

  const map = new Map<string, DailyCost>();

  for (const row of data) {
    const date = row.created_at.slice(0, 10);
    const existing = map.get(date) || { date, cost: 0, calls: 0 };
    existing.cost += Number(row.estimated_cost) || 0;
    existing.calls++;
    map.set(date, existing);
  }

  return Array.from(map.values());
}

export async function getModelBreakdown(): Promise<ModelBreakdown[]> {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data } = await supabase
    .from('token_usage_log')
    .select('model, estimated_cost')
    .gte('created_at', monthStart);

  if (!data || data.length === 0) return [];

  const map = new Map<string, ModelBreakdown>();

  for (const row of data) {
    const label = row.model?.includes('haiku') ? 'Haiku' : row.model?.includes('sonnet') ? 'Sonnet' : row.model || 'Unknown';
    const existing = map.get(label) || { model: label, call_count: 0, total_cost: 0 };
    existing.call_count++;
    existing.total_cost += Number(row.estimated_cost) || 0;
    map.set(label, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.total_cost - a.total_cost);
}
