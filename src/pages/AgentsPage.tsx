// AgentsPage: Agent Control with CEO Agent analysis, real system prompts, test buttons, task logs
import { useState, useEffect } from 'react';
import { Bot, Cpu, Activity, CheckCircle2, Clock, Wrench, Settings2 } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import AgentConfigPanel from '../components/agents/AgentConfigPanel';
import { AGENT_REGISTRY, getAiTaskLogs } from '../services/agents';
import { runCeoAnalysis, type CeoAnalysis } from '../services/ceoAgent';
import { formatTimeAgo } from '../lib/utils';
import type { AiTaskLog } from '../types';

const STATUS_ICON: Record<string, typeof Activity> = {
  Active: Activity,
  Standby: Clock,
  Building: Wrench,
};

const STATUS_COLOR: Record<string, string> = {
  Active: 'bg-jb-success/10 text-jb-success',
  Standby: 'bg-jb-warning/10 text-jb-warning',
  Building: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-jb-success/10 text-jb-success',
  failed: 'bg-jb-danger/10 text-jb-danger',
  running: 'bg-jb-warning/10 text-jb-warning',
};

export default function AgentsPage() {
  const [taskLogs, setTaskLogs] = useState<AiTaskLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [ceoAnalysis, setCeoAnalysis] = useState<CeoAnalysis | null>(null);
  const [ceoLoading, setCeoLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const logs = await getAiTaskLogs();
      setTaskLogs(logs);
    } finally {
      setLoading(false);
    }
  }

  async function handleCeoAnalysis() {
    setCeoLoading(true);
    try {
      const analysis = await runCeoAnalysis();
      setCeoAnalysis(analysis);
      const logs = await getAiTaskLogs();
      setTaskLogs(logs);
    } catch {
      // silent
    } finally {
      setCeoLoading(false);
    }
  }

  const activeAgents = AGENT_REGISTRY.filter((a) => a.status === 'Active').length;
  const completedTasks = taskLogs.filter((t) => t.status === 'completed').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Cpu size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Agent Control</h1>
          <p className="text-sm text-jb-text-secondary">Joshua Brain Agenten-System</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Agents" value={AGENT_REGISTRY.length} icon={<Bot size={15} />} />
        <StatCard label="Active Agents" value={activeAgents} icon={<Activity size={15} />} />
        <StatCard label="AI Tasks" value={completedTasks} icon={<CheckCircle2 size={15} />} />
        <StatCard label="System Status" value="Online" icon={<Activity size={15} />} accent />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-jb-text mb-3">Agenten ({AGENT_REGISTRY.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {AGENT_REGISTRY.map((agent) => {
            const StatusIcon = STATUS_ICON[agent.status] || Activity;
            return (
              <div
                key={agent.name}
                className="bg-jb-card border border-jb-border rounded-xl p-4 hover:border-jb-border-light transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-jb-accent/10 flex items-center justify-center">
                    <Bot size={16} className="text-jb-accent" />
                  </div>
                  <Badge color={STATUS_COLOR[agent.status]}>{agent.status}</Badge>
                </div>
                <h4 className="text-sm font-semibold text-jb-text mb-1">{agent.name}</h4>
                <p className="text-xs text-jb-text-secondary leading-relaxed mb-3">{agent.role}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-jb-text-muted">
                  <StatusIcon size={10} />
                  <span>{agent.lastTask}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CeoAgentSection
        analysis={ceoAnalysis}
        loading={ceoLoading}
        onAnalyze={handleCeoAnalysis}
      />

      <div>
        <h3 className="text-sm font-semibold text-jb-text mb-3 flex items-center gap-2">
          <Settings2 size={14} className="text-jb-accent" /> Agent Konfiguration
        </h3>
        <div className="space-y-2">
          {AGENT_REGISTRY.map((agent) => (
            <AgentConfigPanel key={agent.name} agent={agent} />
          ))}
        </div>
      </div>

      <div className="bg-jb-card border border-jb-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-jb-border">
          <h3 className="text-sm font-semibold text-jb-text">AI Tasks Log</h3>
        </div>
        {taskLogs.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-jb-text-muted">
            Noch keine Tasks geloggt.
          </div>
        ) : (
          <div className="divide-y divide-jb-border max-h-[400px] overflow-y-auto">
            {taskLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-jb-card-hover transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-jb-text">{log.agent_name || 'System'}</span>
                    <Badge color="bg-jb-card border border-jb-border text-jb-text-secondary">{log.task_type}</Badge>
                  </div>
                  <p className="text-xs text-jb-text-secondary truncate">
                    {(log.output_summary || '').slice(0, 80)}{(log.output_summary || '').length > 80 ? '...' : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Badge color={STATUS_COLOR[log.status] || STATUS_COLOR.completed}>{log.status || 'completed'}</Badge>
                  <span className="text-[10px] text-jb-text-muted">{formatTimeAgo(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CeoAgentSection({
  analysis,
  loading,
  onAnalyze,
}: {
  analysis: CeoAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
}) {
  return (
    <div className="bg-jb-card border border-jb-accent/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-jb-border bg-jb-accent/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-jb-accent/20 flex items-center justify-center">
            <span className="text-jb-accent text-xs font-bold">CEO</span>
          </div>
          <div>
            <h2 className="text-sm font-bold text-jb-text">CEO Agent -- System-Optimierung</h2>
            <p className="text-xs text-jb-text-secondary">Analysiert alle Daten und optimiert die anderen Agents automatisch</p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={onAnalyze}
        >
          {loading ? 'Analysiert...' : 'Jetzt analysieren'}
        </Button>
      </div>

      {analysis ? (
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider mb-2">Performance-Zusammenfassung</h3>
            <p className="text-sm text-jb-text leading-relaxed">{analysis.performanceSummary}</p>
          </div>

          {analysis.contentPriorities.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider mb-2">Content-Prioritaeten diese Woche</h3>
              <div className="space-y-2">
                {analysis.contentPriorities.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-jb-accent font-bold text-xs mt-0.5">#{i + 1}</span>
                    <p className="text-sm text-jb-text">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.agentOptimizations.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider mb-2">Agent-Optimierungen</h3>
              <div className="space-y-3">
                {analysis.agentOptimizations.map((opt, i) => (
                  <div key={i} className="bg-jb-bg rounded-lg p-3 border border-jb-border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-jb-accent">{opt.agentName}</span>
                    </div>
                    <p className="text-xs text-jb-text-secondary mb-2">{opt.reason}</p>
                    <p className="text-xs text-jb-text font-mono bg-jb-card rounded p-2 leading-relaxed">{opt.suggestedPromptUpdate}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-jb-text-muted">
            Generiert: {new Date(analysis.generatedAt).toLocaleString('de-DE')}
          </p>
        </div>
      ) : (
        <div className="p-5 text-center text-sm text-jb-text-secondary">
          Klicke "Jetzt analysieren" -- der CEO Agent prueft alle Daten und optimiert das System.
        </div>
      )}
    </div>
  );
}
