// AgentConfigPanel: collapsible panel showing agent system prompt, test button, and recent tasks
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Play, Terminal, Clock } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { callClaude, logAiTask } from '../../services/claude';
import { getAgentTaskLogs } from '../../services/agents';
import { fetchTopPerformanceData, buildPerformanceContext } from '../../services/performanceData';
import { formatTimeAgo } from '../../lib/utils';
import type { AgentInfo, AiTaskLog } from '../../types';

interface AgentConfigPanelProps {
  agent: AgentInfo;
}

export default function AgentConfigPanel({ agent }: AgentConfigPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [recentTasks, setRecentTasks] = useState<AiTaskLog[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    if (expanded && recentTasks.length === 0) {
      getAgentTaskLogs(agent.name, 3).then(setRecentTasks);
    }
  }, [expanded, agent.name]);

  async function handleTest() {
    setTesting(true);
    setTestResult('');
    try {
      const perfData = await fetchTopPerformanceData();
      const context = buildPerformanceContext(perfData);
      const message = context
        ? `${agent.testMessage}\n\n--- DATEN ---\n${context}`
        : agent.testMessage;

      const result = await callClaude(agent.systemPrompt, message);
      await logAiTask(agent.name, 'agent_test', result);
      setTestResult(result);

      const updatedLogs = await getAgentTaskLogs(agent.name, 3);
      setRecentTasks(updatedLogs);
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : 'Test fehlgeschlagen');
    } finally {
      setTesting(false);
    }
  }

  const isDisabled = agent.status === 'Standby' || agent.status === 'Building';

  return (
    <div className="bg-jb-card border border-jb-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-jb-card-hover transition-colors text-left"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-jb-text-muted flex-shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-jb-text-muted flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-jb-text">{agent.name}</span>
        </div>
        <Badge
          color={
            agent.status === 'Active'
              ? 'bg-jb-success/10 text-jb-success'
              : agent.status === 'Building'
              ? 'bg-blue-500/15 text-blue-400'
              : 'bg-jb-warning/10 text-jb-warning'
          }
        >
          {agent.status}
        </Badge>
      </button>

      {expanded && (
        <div className="border-t border-jb-border px-4 py-4 space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-jb-text-muted uppercase tracking-wider mb-1.5">
              System Prompt
            </label>
            <div className="bg-jb-bg border border-jb-border rounded-lg p-3 text-xs text-jb-text-secondary leading-relaxed max-h-32 overflow-y-auto font-mono">
              {agent.systemPrompt}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              icon={<Play size={12} />}
              onClick={handleTest}
              loading={testing}
              disabled={isDisabled}
            >
              {testing ? 'Teste...' : 'Testen'}
            </Button>
            {isDisabled && (
              <span className="text-[10px] text-jb-text-muted">Agent ist noch nicht aktiv</span>
            )}
          </div>

          {testResult && (
            <div className="bg-jb-accent/5 border border-jb-accent/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Terminal size={11} className="text-jb-accent" />
                <span className="text-[10px] font-medium text-jb-accent uppercase tracking-wider">Test Ergebnis</span>
              </div>
              <p className="text-xs text-jb-text leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {testResult}
              </p>
            </div>
          )}

          {recentTasks.length > 0 && (
            <div>
              <label className="block text-[10px] font-medium text-jb-text-muted uppercase tracking-wider mb-1.5">
                Letzte Tasks
              </label>
              <div className="space-y-1.5">
                {recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 bg-jb-bg rounded-lg px-3 py-2"
                  >
                    <Clock size={10} className="text-jb-text-muted flex-shrink-0" />
                    <span className="text-[11px] text-jb-text-secondary flex-1 truncate">
                      {task.task_type}: {(task.output_summary || '').slice(0, 60)}
                    </span>
                    <span className="text-[10px] text-jb-text-muted flex-shrink-0">
                      {formatTimeAgo(task.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
