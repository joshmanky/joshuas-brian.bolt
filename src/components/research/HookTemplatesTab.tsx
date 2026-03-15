import { useState, useEffect } from 'react';
import { Plus, Wand2, ArrowRight, Database, X } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  getAllHookTemplates,
  addHookTemplate,
  extractTemplatesFromDatabase,
  generateHookFromTemplate,
  incrementTemplateUsage,
  type HookTemplate,
} from '../../services/savedContent';

const CATEGORY_OPTIONS = ['Identität', 'Reframe', 'Zahl', 'Kontrast', 'Frage', 'Mythos brechen', 'Personal Story', 'Anti-Perfektionismus', 'Sonstiges'];

function highlightPlaceholders(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) =>
    part.startsWith('[') && part.endsWith(']') ? (
      <span key={i} className="bg-jb-accent/15 text-jb-accent px-1 rounded font-semibold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function HookTemplatesTab({
  onUseInStudio,
}: {
  onUseInStudio?: (hook: string) => void;
}) {
  const [templates, setTemplates] = useState<HookTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ templateText: '', category: 'Identität', example: '' });
  const [adding, setAdding] = useState(false);
  const [generateModal, setGenerateModal] = useState<HookTemplate | null>(null);
  const [thema, setThema] = useState('');
  const [generatedHook, setGeneratedHook] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAllHookTemplates()
      .then(setTemplates)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!newTemplate.templateText.trim()) return;
    setAdding(true);
    try {
      const saved = await addHookTemplate(newTemplate);
      setTemplates((prev) => [saved, ...prev]);
      setNewTemplate({ templateText: '', category: 'Identität', example: '' });
      setShowAddForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Hinzufuegen.');
    } finally {
      setAdding(false);
    }
  }

  async function handleExtract() {
    setExtracting(true);
    setError(null);
    try {
      const newTemplates = await extractTemplatesFromDatabase();
      setTemplates((prev) => [...newTemplates, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Extraktion fehlgeschlagen.');
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerate() {
    if (!generateModal || !thema.trim()) return;
    setGenerating(true);
    setGeneratedHook('');
    try {
      const hook = await generateHookFromTemplate(generateModal.template_text, thema);
      setGeneratedHook(hook);
      await incrementTemplateUsage(generateModal.id);
      setTemplates((prev) =>
        prev.map((t) => (t.id === generateModal.id ? { ...t, times_used: t.times_used + 1 } : t))
      );
    } catch {
      setError('Generierung fehlgeschlagen.');
    } finally {
      setGenerating(false);
    }
  }

  function handleUseGenerated() {
    if (!generatedHook) return;
    if (onUseInStudio) {
      onUseInStudio(generatedHook);
    } else {
      sessionStorage.setItem('research_idea', generatedHook);
      sessionStorage.setItem('research_source', 'Hook-Template');
      window.location.href = '/studio';
    }
    setGenerateModal(null);
    setGeneratedHook('');
    setThema('');
  }

  const mostUsed = templates.reduce((max, t) => (t.times_used > max ? t.times_used : max), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-jb-card border border-jb-border rounded-lg px-3 py-1.5 text-center">
            <p className="text-lg font-bold text-jb-text stat-number">{templates.length}</p>
            <p className="text-[10px] text-jb-text-muted">Templates</p>
          </div>
          <div className="bg-jb-card border border-jb-border rounded-lg px-3 py-1.5 text-center">
            <p className="text-lg font-bold text-jb-text stat-number">{mostUsed}</p>
            <p className="text-[10px] text-jb-text-muted">Meistgenutzt</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Database size={13} />}
            loading={extracting}
            onClick={handleExtract}
          >
            {extracting ? 'Extrahiere...' : 'Templates aus Datenbank'}
          </Button>
          <Button
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            Neues Template
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3 text-sm text-jb-danger flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={13} /></button>
        </div>
      )}

      {showAddForm && (
        <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-jb-text">Neues Hook-Template</h4>
          <div>
            <label className="block text-xs text-jb-text-muted mb-1">Template-Text (nutze [Platzhalter] in eckigen Klammern)</label>
            <textarea
              value={newTemplate.templateText}
              onChange={(e) => setNewTemplate((n) => ({ ...n, templateText: e.target.value }))}
              placeholder="Du bist nicht [Problem]. Du hast [tiefere Ursache]."
              rows={2}
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-jb-text-muted mb-1">Kategorie</label>
              <select
                value={newTemplate.category}
                onChange={(e) => setNewTemplate((n) => ({ ...n, category: e.target.value }))}
                className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors appearance-none"
              >
                {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-jb-text-muted mb-1">Beispiel (wie Josh es nutzen wuerde)</label>
              <input
                type="text"
                value={newTemplate.example}
                onChange={(e) => setNewTemplate((n) => ({ ...n, example: e.target.value }))}
                placeholder="Du bist nicht faul. Du hast einen Identitaetskonflikt."
                className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" loading={adding} onClick={handleAdd} disabled={!newTemplate.templateText.trim()}>
              Speichern
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setShowAddForm(false)}>Abbrechen</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-jb-card border border-jb-border rounded-xl p-4 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onGenerate={() => { setGenerateModal(t); setGeneratedHook(''); setThema(''); }} />
          ))}
        </div>
      )}

      {generateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-jb-card border border-jb-border rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-jb-border">
              <h3 className="text-sm font-semibold text-jb-text">Hook generieren</h3>
              <button onClick={() => { setGenerateModal(null); setGeneratedHook(''); setThema(''); }} className="text-jb-text-muted hover:text-jb-text transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-jb-bg rounded-lg p-3">
                <p className="text-sm text-jb-text">{highlightPlaceholders(generateModal.template_text)}</p>
              </div>
              <div>
                <label className="block text-xs text-jb-text-muted mb-1.5 uppercase tracking-wider">Dein Thema</label>
                <input
                  type="text"
                  value={thema}
                  onChange={(e) => setThema(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  placeholder="z.B. Prokrastination, Network Marketing, Trading..."
                  className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
                />
              </div>
              <Button icon={<Wand2 size={14} />} loading={generating} onClick={handleGenerate} disabled={!thema.trim()} className="w-full">
                {generating ? 'Generiere...' : 'Hook generieren'}
              </Button>
              {generatedHook && (
                <div className="bg-jb-success/5 border border-jb-success/20 rounded-xl p-4 space-y-3">
                  <p className="text-lg font-bold text-jb-text leading-snug">{generatedHook}</p>
                  <Button icon={<ArrowRight size={14} />} onClick={handleUseGenerated} className="w-full">
                    Ins Studio verwenden
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template, onGenerate }: { template: HookTemplate; onGenerate: () => void }) {
  const scoreWidth = `${template.performance_score}%`;
  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-4 hover:border-jb-border-light transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <p className="text-base font-semibold text-jb-text leading-snug">
            {highlightPlaceholders(template.template_text)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {template.category && (
            <Badge color="bg-violet-500/10 text-violet-300 border border-violet-500/20">{template.category}</Badge>
          )}
          {template.times_used > 0 && (
            <Badge color="bg-jb-accent/10 text-jb-accent">{template.times_used}x</Badge>
          )}
        </div>
      </div>

      {template.example && (
        <p className="text-xs text-jb-text-muted italic mb-3 leading-relaxed">&ldquo;{template.example}&rdquo;</p>
      )}

      {template.performance_score > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-jb-text-muted uppercase tracking-wider">Performance Score</span>
            <span className="text-[10px] font-semibold text-jb-text">{template.performance_score}/100</span>
          </div>
          <div className="h-1 bg-jb-bg rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                template.performance_score >= 70 ? 'bg-jb-success' : template.performance_score >= 40 ? 'bg-jb-warning' : 'bg-jb-danger'
              }`}
              style={{ width: scoreWidth }}
            />
          </div>
        </div>
      )}

      <Button size="sm" variant="secondary" icon={<Wand2 size={12} />} onClick={onGenerate} className="w-full">
        Hook generieren
      </Button>
    </div>
  );
}
