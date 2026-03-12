// AgentArchitectSection: AI analyzes agent stack and proposes 3-5 new agents to fill gaps
// Updated: compressed system prompt, DACH-Markt focus
import { useState } from 'react';
import { Cpu, Plus, Sparkles, Loader, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import { callClaude, logAiTask } from '../../services/claude';
import { supabase } from '../../lib/supabase';
import { AGENT_REGISTRY } from '../../services/agents';
import type { AgentProposal } from '../../types';

interface ArchitectSuggestion {
  name: string;
  role: string;
  description: string;
  reasoning: string;
  system_prompt: string;
}

const ARCHITECT_SYSTEM_PROMPT = `Agent Architect fuer Joshua Brain Dashboard. Nische: H.I.S.-Methode, Anti-Guru Blockadenloesung, Network Marketing + Trading, DACH-Markt, Zielgruppe 20-30 Jahre. Analysiere den Agent Stack und schlage 3-5 neue Agents vor (Content-Automatisierung, Lead-Generierung, Performance). Antworte NUR als JSON: [{"name":"...","role":"1 Satz","description":"2-3 Saetze","reasoning":"warum fehlt","system_prompt":"mind. 100 Woerter, auf Joshs Nische zugeschnitten"}]`;

interface AgentArchitectSectionProps {
  onProposalAdded: (proposal: AgentProposal) => void;
}

export default function AgentArchitectSection({ onProposalAdded }: AgentArchitectSectionProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<ArchitectSuggestion[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    setSuggestions([]);
    setAddedIndices(new Set());

    try {
      const agentList = AGENT_REGISTRY.map(a => `${a.name}: ${a.role} (${a.status})`).join(', ');
      const userMsg = `Aktueller Agent Stack (${AGENT_REGISTRY.length} Agents): ${agentList}. Schlage 3-5 neue Agents vor die fehlen.`;

      const raw = await callClaude(ARCHITECT_SYSTEM_PROMPT, userMsg, undefined, undefined, 'Agent Architect');
      await logAiTask('Agent Architect', 'agent_architecture_analysis', raw);

      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Kein JSON Array erhalten');

      const parsed = JSON.parse(jsonMatch[0]) as ArchitectSuggestion[];
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Leeres Ergebnis');
      setSuggestions(parsed);
    } catch {
      setError('Analyse fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setAnalyzing(false);
      setHasAnalyzed(true);
    }
  }

  async function handleAdd(suggestion: ArchitectSuggestion, index: number) {
    setAddingIndex(index);
    try {
      const { data } = await supabase
        .from('agent_proposals')
        .insert({
          name: suggestion.name,
          role: suggestion.role,
          status: 'pending',
          system_prompt: suggestion.system_prompt,
          test_message: `Teste dich selbst: Was wuerdest du als ${suggestion.name} als erstes tun?`,
          reasoning: suggestion.reasoning,
          raw_task_description: `[Agent Architect] ${suggestion.description}`,
        })
        .select()
        .maybeSingle();

      if (data) {
        onProposalAdded(data as AgentProposal);
        setAddedIndices(prev => new Set(prev).add(index));
      }
    } finally {
      setAddingIndex(null);
    }
  }

  const showPlaceholder = !analyzing && suggestions.length === 0 && !error;

  return (
    <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-jb-accent/10 flex items-center justify-center">
            <Cpu size={16} className="text-jb-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-jb-text">Agent Architect</h3>
            <p className="text-xs text-jb-text-muted">
              KI analysiert deinen Stack und schlaegt fehlende Agents vor
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles size={14} />}
          onClick={handleAnalyze}
          loading={analyzing}
          disabled={analyzing}
        >
          {analyzing ? 'Analysiert...' : 'Neue Agents vorschlagen'}
        </Button>
      </div>

      {analyzing && (
        <div className="flex items-center gap-3 py-8 justify-center">
          <Loader size={18} className="text-jb-accent animate-spin" />
          <p className="text-sm text-jb-text-muted">Agent Architect analysiert...</p>
        </div>
      )}

      {error && (
        <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3">
          <p className="text-xs text-jb-danger">{error}</p>
        </div>
      )}

      {showPlaceholder && (
        <div className="py-6 text-center">
          <p className="text-xs text-jb-text-muted">
            {hasAnalyzed
              ? 'Keine Vorschlaege erhalten. Versuche es erneut.'
              : 'Noch keine Vorschlaege generiert. Klicke oben auf "Neue Agents vorschlagen" um zu starten.'}
          </p>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-jb-text-secondary font-medium uppercase tracking-wider">
            {suggestions.length} Vorschlaege
          </p>
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-jb-bg border border-jb-border rounded-xl p-4 space-y-3 hover:border-jb-border-light transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-jb-text">{s.name}</h4>
                  <p className="text-xs text-jb-accent mt-0.5">{s.role}</p>
                </div>
                {addedIndices.has(i) ? (
                  <span className="inline-flex items-center gap-1 text-xs text-jb-success font-medium px-2.5 py-1 bg-jb-success/10 rounded-lg flex-shrink-0">
                    <CheckCircle2 size={12} />
                    Hinzugefuegt
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Plus size={13} />}
                    onClick={() => handleAdd(s, i)}
                    loading={addingIndex === i}
                    disabled={addingIndex !== null}
                  >
                    Agent hinzufuegen
                  </Button>
                )}
              </div>
              <p className="text-xs text-jb-text-secondary leading-relaxed">{s.description}</p>
              <div className="bg-jb-accent/5 border border-jb-accent/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-jb-accent font-medium uppercase tracking-wider mb-1">
                  Warum dieser Agent fehlt
                </p>
                <p className="text-xs text-jb-text-muted leading-relaxed italic">{s.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
