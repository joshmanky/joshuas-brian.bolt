// AgentArchitectSection: AI analyzes agent stack and proposes 3-5 new agents to fill gaps
import { useState } from 'react';
import { Cpu, Plus, Sparkles, Loader } from 'lucide-react';
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

const ARCHITECT_SYSTEM_PROMPT = `Du bist der Agent Architect fuer Joshua Brain. Analysiere den aktuellen Agent Stack und schlage 3-5 neue Agents vor die das System ergaenzen wuerden. Fokus auf Content-Automatisierung, Lead-Generierung und Performance-Optimierung.

Joshua Tischer's Nische: Psychologische Blockadenloesung, H.I.S.-Methode, Network Marketing, Trading.
Zielgruppe: 20-30 Jahre, "innerlich festgefahrene Potenzialtraeger".

Antworte NUR als JSON Array mit Objekten: [{"name": "...", "role": "...", "description": "...", "reasoning": "...", "system_prompt": "..."}]

Jeder Vorschlag muss:
- Einen konkreten Namen haben
- Eine klare Rolle beschreiben (1 Satz)
- Eine ausfuehrliche Beschreibung enthalten (2-3 Saetze)
- Begruenden WARUM dieser Agent fehlt und das System verbessert
- Einen vollstaendigen System Prompt enthalten (mindestens 100 Woerter, auf Joshs Nische zugeschnitten)`;

interface AgentArchitectSectionProps {
  onProposalAdded: (proposal: AgentProposal) => void;
}

export default function AgentArchitectSection({ onProposalAdded }: AgentArchitectSectionProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<ArchitectSuggestion[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    setSuggestions([]);
    setAddedIndices(new Set());

    try {
      const currentAgents = AGENT_REGISTRY.map(a => `- ${a.name}: ${a.role} (${a.status})`).join('\n');
      const userMsg = `Aktueller Agent Stack (${AGENT_REGISTRY.length} Agents):\n${currentAgents}\n\nAnalysiere diesen Stack und schlage 3-5 neue Agents vor die fehlen.`;

      const raw = await callClaude(ARCHITECT_SYSTEM_PROMPT, userMsg);
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

  return (
    <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-jb-accent/10 flex items-center justify-center">
            <Cpu size={16} className="text-jb-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-jb-text">Agent Architect</h3>
            <p className="text-xs text-jb-text-muted">
              Analysiert den Stack und schlaegt neue Agents vor
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles size={14} />}
          onClick={handleAnalyze}
          loading={analyzing}
        >
          {analyzing ? 'Analysiert...' : 'Neue Agents vorschlagen'}
        </Button>
      </div>

      {analyzing && (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Loader size={18} className="text-jb-accent animate-spin" />
          <p className="text-sm text-jb-text-muted">Agent Architect analysiert...</p>
        </div>
      )}

      {error && (
        <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3">
          <p className="text-xs text-jb-danger">{error}</p>
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
                  <span className="text-xs text-jb-success font-medium px-2.5 py-1 bg-jb-success/10 rounded-lg flex-shrink-0">
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
                    Hinzufuegen
                  </Button>
                )}
              </div>
              <p className="text-xs text-jb-text-secondary leading-relaxed">{s.description}</p>
              <div className="bg-jb-accent/5 border border-jb-accent/10 rounded-lg px-3 py-2">
                <p className="text-[10px] text-jb-accent font-medium uppercase tracking-wider mb-1">
                  Warum dieser Agent fehlt
                </p>
                <p className="text-xs text-jb-text-muted leading-relaxed">{s.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
