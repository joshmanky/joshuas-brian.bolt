// AgentHiringTab: propose, review, test and approve/reject new agents via Claude + Agent Architect
// Updated: compressed system prompt
import { useState, useEffect } from 'react';
import { Send, Play, CheckCircle2, XCircle, ChevronDown, ChevronRight, AlertCircle, Copy } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import AgentArchitectSection from './AgentArchitectSection';
import { supabase } from '../../lib/supabase';
import { callClaude, logAiTask } from '../../services/claude';
import { formatDate } from '../../lib/utils';
import type { AgentProposal } from '../../types';

const HIRING_SYSTEM_PROMPT = `CEO des Joshua Brain Systems. Nische: H.I.S.-Methode, Anti-Guru Blockadenloesung, Network Marketing + Trading, DreamChasers Industry. Erstelle einen Agent-Vorschlag basierend auf der Aufgabe. Antworte NUR als JSON: {"name":"...","role":"1 Satz","status":"Vorgeschlagen","systemPrompt":"mind. 150 Woerter, Joshs Nische","testMessage":"...","reasoning":"2-3 Saetze"}`;

const CREATE_TABLE_SQL = `CREATE TABLE agent_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  system_prompt TEXT NOT NULL,
  test_message TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  raw_task_description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);`;

export default function AgentHiringTab() {
  const [proposals, setProposals] = useState<AgentProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    const { data, error } = await supabase
      .from('agent_proposals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setTableError(true);
      setLoading(false);
      return;
    }
    setProposals((data || []) as AgentProposal[]);
    setLoading(false);
  }

  async function handleSubmit() {
    if (!taskInput.trim()) return;
    setSubmitting(true);
    try {
      const raw = await callClaude(HIRING_SYSTEM_PROMPT, taskInput.trim(), undefined, undefined, 'CEO Agent');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Kein JSON erhalten');
      const parsed = JSON.parse(jsonMatch[0]);

      const { data } = await supabase
        .from('agent_proposals')
        .insert({
          name: parsed.name,
          role: parsed.role,
          status: 'pending',
          system_prompt: parsed.systemPrompt,
          test_message: parsed.testMessage,
          reasoning: parsed.reasoning,
          raw_task_description: taskInput.trim(),
        })
        .select()
        .maybeSingle();

      if (data) setProposals((prev) => [data as AgentProposal, ...prev]);
      setTaskInput('');
      await logAiTask('CEO Agent', 'agent_hiring_proposal', `Neuer Agent vorgeschlagen: ${parsed.name}`);
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTest(proposal: AgentProposal) {
    setTestingId(proposal.id);
    try {
      const result = await callClaude(proposal.system_prompt, proposal.test_message, undefined, undefined, proposal.name);
      setTestResults((prev) => ({ ...prev, [proposal.id]: result }));
    } catch {
      setTestResults((prev) => ({ ...prev, [proposal.id]: 'Test fehlgeschlagen.' }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleApprove(id: string) {
    await supabase.from('agent_proposals').update({ status: 'approved' }).eq('id', id);
    setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: 'approved' } : p));
    await logAiTask('CEO Agent', 'agent_hiring_approved', `Agent ${id} genehmigt`);
  }

  async function handleReject(id: string) {
    await supabase.from('agent_proposals').update({ status: 'rejected' }).eq('id', id);
    setProposals((prev) => prev.map((p) => p.id === id ? { ...p, status: 'rejected' } : p));
  }

  function handleCopySQL() {
    navigator.clipboard.writeText(CREATE_TABLE_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-jb-warning/10 text-jb-warning',
    approved: 'bg-jb-success/10 text-jb-success',
    rejected: 'bg-jb-danger/10 text-jb-danger',
  };

  if (loading) return <LoadingSpinner />;

  if (tableError) {
    return (
      <div className="bg-jb-card border border-jb-warning/30 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-jb-warning">
          <AlertCircle size={18} />
          <h3 className="text-sm font-semibold">Setup erforderlich: Erstelle die Tabelle 'agent_proposals' in Supabase.</h3>
        </div>
        <div className="relative">
          <pre className="bg-jb-bg border border-jb-border rounded-lg p-4 text-xs text-jb-text font-mono overflow-x-auto leading-relaxed">
            {CREATE_TABLE_SQL}
          </pre>
          <button
            onClick={handleCopySQL}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-jb-card border border-jb-border text-jb-text-muted hover:text-jb-text transition-colors"
            title="Kopieren"
          >
            <Copy size={13} />
          </button>
          {copied && (
            <span className="absolute top-2 right-10 text-[10px] text-jb-success font-medium">Kopiert!</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AgentArchitectSection
        onProposalAdded={(proposal) => setProposals((prev) => [proposal, ...prev])}
      />

      <div className="bg-jb-card border border-jb-border rounded-xl p-5 space-y-3">
        <label className="block text-xs font-medium text-jb-text-secondary uppercase tracking-wider">
          Was soll dieser Agent tun?
        </label>
        <textarea
          value={taskInput}
          onChange={(e) => setTaskInput(e.target.value)}
          rows={3}
          placeholder="z.B. Ein Agent der automatisch YouTube-Titel optimiert basierend auf Performance-Daten..."
          className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors resize-none"
        />
        <div className="flex justify-end">
          <Button
            variant="primary"
            icon={<Send size={14} />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!taskInput.trim()}
          >
            Bewerbung einreichen
          </Button>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-jb-text-muted">Noch keine Agent-Vorschlaege erstellt.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-jb-text">Vorschlaege ({proposals.length})</h3>
          {proposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-jb-card border border-jb-border rounded-xl overflow-hidden hover:border-jb-border-light transition-all duration-200"
            >
              <button
                onClick={() => setExpandedId(expandedId === proposal.id ? null : proposal.id)}
                className="w-full flex items-center gap-3 px-5 py-4 text-left"
              >
                {expandedId === proposal.id ? (
                  <ChevronDown size={14} className="text-jb-text-muted flex-shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-jb-text-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-jb-text">{proposal.name}</h4>
                  <p className="text-xs text-jb-text-secondary mt-0.5">{proposal.role}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge color={STATUS_COLORS[proposal.status]}>{proposal.status}</Badge>
                  <span className="text-[10px] text-jb-text-muted">{formatDate(proposal.created_at)}</span>
                </div>
              </button>

              {expandedId === proposal.id && (
                <div className="border-t border-jb-border px-5 py-4 space-y-4">
                  <div>
                    <label className="block text-[10px] font-medium text-jb-text-muted uppercase tracking-wider mb-1.5">
                      Begruendung
                    </label>
                    <p className="text-sm text-jb-text leading-relaxed">{proposal.reasoning}</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-jb-text-muted uppercase tracking-wider mb-1.5">
                      System Prompt
                    </label>
                    <div className="bg-jb-bg border border-jb-border rounded-lg p-3 text-xs text-jb-text-secondary leading-relaxed max-h-32 overflow-y-auto font-mono">
                      {proposal.system_prompt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Play size={12} />}
                      onClick={() => handleTest(proposal)}
                      loading={testingId === proposal.id}
                    >
                      {testingId === proposal.id ? 'Testet...' : 'Testen'}
                    </Button>
                    {proposal.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={<CheckCircle2 size={12} />}
                          onClick={() => handleApprove(proposal.id)}
                        >
                          Genehmigen
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<XCircle size={12} />}
                          onClick={() => handleReject(proposal.id)}
                        >
                          Ablehnen
                        </Button>
                      </>
                    )}
                  </div>

                  {testResults[proposal.id] && (
                    <div className="bg-jb-accent/5 border border-jb-accent/20 rounded-lg p-3">
                      <span className="text-[10px] font-medium text-jb-accent uppercase tracking-wider">Test Ergebnis</span>
                      <p className="text-xs text-jb-text leading-relaxed whitespace-pre-wrap mt-1.5 max-h-48 overflow-y-auto">
                        {testResults[proposal.id]}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-medium text-jb-text-muted uppercase tracking-wider mb-1">
                      Urspruengliche Aufgabe
                    </label>
                    <p className="text-xs text-jb-text-secondary">{proposal.raw_task_description}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
