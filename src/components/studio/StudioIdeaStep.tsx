import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Plus, Sparkles, ChevronDown, ChevronRight, ArrowRight, BookOpen, X, Wand2 } from 'lucide-react';
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
import {
  getAllHookTemplates,
  generateHookFromTemplate,
  incrementTemplateUsage,
  type HookTemplate,
} from '../../services/savedContent';
import { HOOK_TYPE_LABELS, PLATFORM_OPTIONS } from '../../types';
import type { ResearchItem, HookType } from '../../types';

function highlightPlaceholders(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <span key={i} className="bg-jb-accent/15 text-jb-accent px-0.5 rounded font-semibold text-xs">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<HookTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<HookTemplate | null>(null);
  const [templateThema, setTemplateThema] = useState('');
  const [generatingHook, setGeneratingHook] = useState(false);
  const [generatedTemplateHook, setGeneratedTemplateHook] = useState('');

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

  async function handleOpenTemplateModal() {
    setShowTemplateModal(true);
    setSelectedTemplate(null);
    setGeneratedTemplateHook('');
    setTemplateThema('');
    if (templates.length === 0) {
      const t = await getAllHookTemplates().catch(() => []);
      setTemplates(t);
    }
  }

  async function handleGenerateFromTemplate() {
    if (!selectedTemplate || !templateThema.trim()) return;
    setGeneratingHook(true);
    setGeneratedTemplateHook('');
    try {
      const hook = await generateHookFromTemplate(selectedTemplate.template_text, templateThema);
      setGeneratedTemplateHook(hook);
      await incrementTemplateUsage(selectedTemplate.id);
    } catch {} finally {
      setGeneratingHook(false);
    }
  }

  function handleUseTemplateHook() {
    if (!generatedTemplateHook) return;
    setFormTitle(generatedTemplateHook);
    setShowForm(true);
    setShowTemplateModal(false);
    setGeneratedTemplateHook('');
    setSelectedTemplate(null);
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
          <div className="flex items-center gap-2 flex-wrap">
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
            <Button
              variant="secondary"
              size="sm"
              icon={<BookOpen size={13} />}
              onClick={handleOpenTemplateModal}
            >
              Hook-Template nutzen
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

      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-jb-card border border-jb-border rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-jb-border flex-shrink-0">
              <h3 className="text-sm font-semibold text-jb-text flex items-center gap-2">
                <BookOpen size={14} className="text-jb-accent" /> Hook-Template nutzen
              </h3>
              <button
                onClick={() => { setShowTemplateModal(false); setSelectedTemplate(null); setGeneratedTemplateHook(''); }}
                className="text-jb-text-muted hover:text-jb-text transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {templates.length === 0 ? (
                <p className="text-sm text-jb-text-muted text-center py-8">Lade Templates...</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTemplate(t); setGeneratedTemplateHook(''); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${
                        selectedTemplate?.id === t.id
                          ? 'border-jb-accent/50 bg-jb-accent/5'
                          : 'border-jb-border bg-jb-bg hover:border-jb-border-light'
                      }`}
                    >
                      <p className="text-sm text-jb-text leading-snug">{highlightPlaceholders(t.template_text)}</p>
                      {t.example && <p className="text-xs text-jb-text-muted italic mt-1">&ldquo;{t.example}&rdquo;</p>}
                      {t.category && <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">{t.category}</span>}
                    </button>
                  ))}
                </div>
              )}

              {selectedTemplate && (
                <div className="space-y-3 pt-2 border-t border-jb-border">
                  <div>
                    <label className="block text-xs text-jb-text-muted mb-1.5 uppercase tracking-wider">Dein Thema</label>
                    <input
                      type="text"
                      value={templateThema}
                      onChange={(e) => setTemplateThema(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleGenerateFromTemplate()}
                      placeholder="z.B. Prokrastination, Network Marketing, Trading..."
                      className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
                    />
                  </div>
                  <Button
                    icon={<Wand2 size={14} />}
                    loading={generatingHook}
                    onClick={handleGenerateFromTemplate}
                    disabled={!templateThema.trim()}
                    className="w-full"
                  >
                    {generatingHook ? 'Generiere Hook...' : 'Hook generieren'}
                  </Button>
                  {generatedTemplateHook && (
                    <div className="bg-jb-success/5 border border-jb-success/20 rounded-xl p-4 space-y-3">
                      <p className="text-base font-bold text-jb-text leading-snug">{generatedTemplateHook}</p>
                      <Button icon={<ArrowRight size={14} />} onClick={handleUseTemplateHook} className="w-full">
                        Als Idee verwenden
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
