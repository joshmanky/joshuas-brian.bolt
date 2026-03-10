// StudioIdeaStep: Step 1 of the Content Studio flow — select or create an idea
// Created: collapsible section with idea list, AI generation, and manual input
import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Plus, Sparkles, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import {
  getAllResearchItems,
  createResearchItem,
  deleteResearchItem,
  generateResearchIdeas,
} from '../../services/research';
import { HOOK_TYPE_LABELS, PLATFORM_OPTIONS } from '../../types';
import type { ResearchItem, HookType } from '../../types';

interface StudioIdeaStepProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedIdea: ResearchItem | null;
  onSelectIdea: (idea: ResearchItem) => void;
  prefilledContent?: string;
}

const HOOK_OPTIONS = Object.entries(HOOK_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

export default function StudioIdeaStep({
  isOpen,
  onToggle,
  selectedIdea,
  onSelectIdea,
  prefilledContent,
}: StudioIdeaStepProps) {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formHook, setFormHook] = useState('statement_hook');
  const [formPlatform, setFormPlatform] = useState('instagram');

  const loadItems = useCallback(async () => {
    try {
      const data = await getAllResearchItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  useEffect(() => {
    if (prefilledContent) {
      setFormTitle(prefilledContent);
      setShowForm(true);
    }
  }, [prefilledContent]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const ideas = await generateResearchIdeas();
      setItems((prev) => [...ideas, ...prev]);
    } catch {} finally {
      setGenerating(false);
    }
  }

  async function handleSaveIdea() {
    if (!formTitle.trim()) return;
    const item = await createResearchItem({
      title: formTitle.trim(),
      hook_type: formHook,
      platform: formPlatform,
    });
    if (item) {
      setItems((prev) => [item, ...prev]);
      onSelectIdea(item);
      setFormTitle('');
      setShowForm(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteResearchItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const stepDone = !!selectedIdea;

  return (
    <div className={`bg-jb-card border rounded-xl overflow-hidden transition-all duration-300 ${
      stepDone && !isOpen ? 'border-jb-success/30' : isOpen ? 'border-jb-accent/40' : 'border-jb-border'
    }`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-jb-card-hover transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            stepDone ? 'bg-jb-success/20 text-jb-success' : 'bg-jb-accent/20 text-jb-accent'
          }`}>
            1
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-jb-text">Idee</h3>
            {selectedIdea && !isOpen && (
              <p className="text-xs text-jb-text-secondary truncate max-w-[400px]">{selectedIdea.title}</p>
            )}
          </div>
          {stepDone && !isOpen && (
            <Badge color="bg-jb-success/10 text-jb-success">Ausgewaehlt</Badge>
          )}
        </div>
        {isOpen ? <ChevronDown size={16} className="text-jb-text-muted" /> : <ChevronRight size={16} className="text-jb-text-muted" />}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-jb-border pt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={13} />}
              onClick={handleGenerate}
              loading={generating}
            >
              AI Ideen generieren
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={() => setShowForm(!showForm)}
            >
              Eigene Idee
            </Button>
          </div>

          {generating && <LoadingSpinner message="AI analysiert Top-Posts..." />}

          {showForm && (
            <div className="bg-jb-bg border border-jb-border rounded-lg p-4 space-y-3">
              <textarea
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Beschreibe deine Content-Idee..."
                rows={2}
                className="w-full bg-jb-card border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Plattform" options={PLATFORM_OPTIONS} value={formPlatform} onChange={(e) => setFormPlatform(e.target.value)} />
                <Select label="Hook-Typ" options={HOOK_OPTIONS} value={formHook} onChange={(e) => setFormHook(e.target.value)} />
              </div>
              <Button size="sm" onClick={handleSaveIdea} disabled={!formTitle.trim()} className="w-full">
                Speichern & auswaehlen
              </Button>
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : items.length === 0 ? (
            <p className="text-sm text-jb-text-muted text-center py-4">
              Noch keine Ideen. Generiere welche oder erstelle eigene.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group ${
                    selectedIdea?.id === item.id
                      ? 'bg-jb-accent/10 border border-jb-accent/30'
                      : 'bg-jb-bg border border-transparent hover:border-jb-border-light'
                  }`}
                  onClick={() => onSelectIdea(item)}
                >
                  <Lightbulb size={14} className={selectedIdea?.id === item.id ? 'text-jb-accent' : 'text-jb-text-muted'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-jb-text truncate">{item.title}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge>{HOOK_TYPE_LABELS[item.hook_type as HookType] || item.hook_type}</Badge>
                      <Badge>{item.platform}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="text-xs text-jb-text-muted hover:text-jb-danger transition-colors px-1"
                    >
                      X
                    </button>
                    <ArrowRight size={14} className="text-jb-accent" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
