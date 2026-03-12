// TokenUsageDashboard: displays token usage stats, agent breakdown, daily costs
// Created: full token cost transparency for Settings page
import { useState, useEffect } from 'react';
import { Coins, TrendingUp, Cpu, Calendar, Bot, Zap } from 'lucide-react';
import {
  getTokenUsageSummary,
  getAgentCostBreakdown,
  getDailyCosts,
  getModelBreakdown,
  type TokenUsageSummary,
  type AgentCostBreakdown,
  type DailyCost,
  type ModelBreakdown,
} from '../../services/tokenUsage';

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
  return tokens.toLocaleString('de-DE');
}

export default function TokenUsageDashboard() {
  const [summary, setSummary] = useState<TokenUsageSummary | null>(null);
  const [agents, setAgents] = useState<AgentCostBreakdown[]>([]);
  const [daily, setDaily] = useState<DailyCost[]>([]);
  const [models, setModels] = useState<ModelBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTokenUsageSummary(),
      getAgentCostBreakdown(),
      getDailyCosts(7),
      getModelBreakdown(),
    ]).then(([s, a, d, m]) => {
      setSummary(s);
      setAgents(a);
      setDaily(d);
      setModels(m);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="shimmer h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const maxDailyCost = Math.max(...daily.map(d => d.cost), 0.001);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <CostCard
          label="Heute"
          cost={summary.totalCostToday}
          calls={summary.totalCallsToday}
          icon={<Zap size={14} />}
        />
        <CostCard
          label="Diese Woche"
          cost={summary.totalCostWeek}
          calls={summary.totalCallsWeek}
          icon={<TrendingUp size={14} />}
        />
        <CostCard
          label="Dieser Monat"
          cost={summary.totalCostMonth}
          calls={summary.totalCallsMonth}
          icon={<Calendar size={14} />}
        />
      </div>

      <div className="bg-jb-card border border-jb-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Cpu size={12} /> Token-Verbrauch (Monat)
          </h4>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-jb-bg rounded-lg p-3">
            <p className="text-[10px] text-jb-text-muted uppercase tracking-wider">Input Tokens</p>
            <p className="text-lg font-bold text-jb-text stat-number mt-0.5">
              {formatTokens(summary.totalInputTokens)}
            </p>
          </div>
          <div className="bg-jb-bg rounded-lg p-3">
            <p className="text-[10px] text-jb-text-muted uppercase tracking-wider">Output Tokens</p>
            <p className="text-lg font-bold text-jb-text stat-number mt-0.5">
              {formatTokens(summary.totalOutputTokens)}
            </p>
          </div>
        </div>
      </div>

      {models.length > 0 && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Cpu size={12} /> Model-Verteilung
          </h4>
          <div className="space-y-2">
            {models.map((m) => {
              const totalCalls = models.reduce((sum, x) => sum + x.call_count, 0);
              const pct = totalCalls > 0 ? (m.call_count / totalCalls) * 100 : 0;
              return (
                <div key={m.model} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-jb-text">{m.model}</span>
                      <span className="text-[10px] text-jb-text-muted stat-number">
                        {m.call_count}x / {formatCost(m.total_cost)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-jb-bg rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          m.model === 'Haiku' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {agents.length > 0 && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Bot size={12} /> Kosten nach Agent (Monat)
          </h4>
          <div className="space-y-2">
            {agents.map((a) => (
              <div key={a.agent_name} className="flex items-center justify-between py-1.5 border-b border-jb-border/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-jb-text truncate">{a.agent_name}</p>
                  <p className="text-[10px] text-jb-text-muted stat-number">
                    {a.call_count} Aufrufe / {formatTokens(a.total_input + a.total_output)} Tokens
                  </p>
                </div>
                <span className="text-xs font-semibold text-jb-text stat-number ml-3">
                  {formatCost(a.total_cost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {daily.length > 0 && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Coins size={12} /> Tagesverlauf (letzte 7 Tage)
          </h4>
          <div className="space-y-1.5">
            {daily.map((d) => (
              <div key={d.date} className="flex items-center gap-3">
                <span className="text-[10px] text-jb-text-muted stat-number w-16 flex-shrink-0">
                  {new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
                <div className="flex-1 h-4 bg-jb-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-jb-accent/60 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max((d.cost / maxDailyCost) * 100, 2)}%` }}
                  />
                </div>
                <span className="text-[10px] text-jb-text-muted stat-number w-14 text-right flex-shrink-0">
                  {formatCost(d.cost)}
                </span>
                <span className="text-[10px] text-jb-text-muted w-8 text-right flex-shrink-0">
                  {d.calls}x
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.totalCallsMonth === 0 && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-6 text-center">
          <Coins size={24} className="text-jb-text-muted mx-auto mb-2" />
          <p className="text-sm text-jb-text-muted">
            Noch keine Token-Daten vorhanden. Die Kosten werden nach dem naechsten Claude API Aufruf sichtbar.
          </p>
        </div>
      )}
    </div>
  );
}

function CostCard({ label, cost, calls, icon }: { label: string; cost: number; calls: number; icon: React.ReactNode }) {
  return (
    <div className="bg-jb-bg border border-jb-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-jb-text-muted">{icon}</span>
        <p className="text-[10px] text-jb-text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-lg font-bold text-jb-text stat-number">{formatCost(cost)}</p>
      <p className="text-[10px] text-jb-text-muted stat-number">{calls} Aufrufe</p>
    </div>
  );
}
