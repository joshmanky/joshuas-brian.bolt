import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ExternalLink, ArrowRight, RefreshCw, Wand2, Info, Plus, FolderOpen } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { analyzeContentLink, markAsUsedIdea, type SavedContent } from '../../services/savedContent';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

const DEFAULT_FOLDERS = ['Allgemein', 'H.I.S.-Methode', 'Trading', 'Lifestyle', 'Network Marketing'];

function getOutlierColor(score: number) {
  if (score >= 70) return 'text-jb-success';
  if (score >= 40) return 'text-jb-warning';
  return 'text-jb-danger';
}

function getOutlierBg(score: number) {
  if (score >= 70) return 'bg-jb-success/10 border-jb-success/20';
  if (score >= 40) return 'bg-jb-warning/10 border-jb-warning/20';
  return 'bg-jb-danger/10 border-jb-danger/20';
}

export default function AnalyzeTab({ onAnalyzed }: { onAnalyzed?: () => void }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [rawInput, setRawInput] = useState('');
  const [projectFolder, setProjectFolder] = useState('Allgemein');
  const [customFolderInput, setCustomFolderInput] = useState('');
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SavedContent | null>(null);

  async function handleAnalyze() {
    if (!url.trim() && !rawInput.trim()) {
      setError('URL oder Caption muss vorhanden sein.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const saved = await analyzeContentLink({
        url: url.trim(),
        creatorName: creatorName.trim(),
        platform,
        rawInput: rawInput.trim(),
        projectFolder,
      });
      setResult(saved);
      onAnalyzed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  }

  function handleAddFolder() {
    const name = customFolderInput.trim();
    if (!name || folders.includes(name)) return;
    setFolders((f) => [...f, name]);
    setProjectFolder(name);
    setCustomFolderInput('');
    setShowAddFolder(false);
  }

  async function handleUseAsIdea() {
    if (!result) return;
    if (result.id) await markAsUsedIdea(result.id);
    sessionStorage.setItem('research_idea', result.adapted_hook || result.hook_text || '');
    sessionStorage.setItem('research_source', result.creator_name || platform);
    sessionStorage.setItem('research_url', result.source_url || '');
    navigate('/studio');
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/p/... oder https://www.tiktok.com/@creator/video/..."
            className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">Creator Name</label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="@creatorname"
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">Plattform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors appearance-none"
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
            Caption / Transkript <span className="normal-case text-jb-text-muted font-normal">(optional, aber empfohlen)</span>
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={'Fuege die Caption oder den gesprochenen Text des Videos hier ein.\nTipp: Bei Instagram → Post öffnen → Caption kopieren.\nBei TikTok → Video öffnen → Beschreibung kopieren.'}
            rows={4}
            className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider flex items-center gap-1">
            <FolderOpen size={11} />
            Projekt-Ordner
          </label>
          <div className="flex gap-2">
            <select
              value={projectFolder}
              onChange={(e) => setProjectFolder(e.target.value)}
              className="flex-1 bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors appearance-none"
            >
              {folders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddFolder(!showAddFolder)}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-jb-border text-jb-text-muted hover:text-jb-accent hover:border-jb-accent/30 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          {showAddFolder && (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={customFolderInput}
                onChange={(e) => setCustomFolderInput(e.target.value)}
                placeholder="Neuer Ordner-Name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddFolder()}
                className="flex-1 bg-jb-bg border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
              />
              <Button size="sm" onClick={handleAddFolder} disabled={!customFolderInput.trim()}>Erstellen</Button>
            </div>
          )}
        </div>

        <div className="bg-jb-bg border border-jb-border rounded-lg p-3 flex items-start gap-2">
          <Info size={14} className="text-jb-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-jb-text-muted leading-relaxed">
            <span className="text-jb-text">Tipp:</span> Je mehr Caption-Text du einfuegst, desto praeziser die Analyse.
            Outlier Score 70+ = hohes Viral-Potential fuer Joshs Nische.
          </p>
        </div>

        {error && (
          <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3 text-sm text-jb-danger">{error}</div>
        )}

        <Button size="lg" icon={<Wand2 size={18} />} loading={loading} onClick={handleAnalyze} className="w-full">
          {loading ? 'Content Research Agent analysiert Viral-Muster...' : 'Outlier analysieren'}
        </Button>
      </div>

      {result && (
        <div className="bg-jb-card border border-jb-success/30 rounded-xl overflow-hidden">
          <div className="bg-jb-success/10 border-b border-jb-success/20 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-jb-success" />
              <span className="text-sm font-semibold text-jb-success">Analysiert und gespeichert</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${getOutlierBg(result.outlier_score)}`}>
              <span className={`text-xl font-black ${getOutlierColor(result.outlier_score)}`}>{result.outlier_score}</span>
              <span className="text-xs text-jb-text-muted">Outlier Score</span>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-xl font-bold text-jb-text leading-tight">{result.adapted_hook}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge color="bg-jb-accent/10 text-jb-accent">{result.source_platform}</Badge>
                {result.video_format && <Badge color="bg-jb-card border border-jb-border text-jb-text-secondary">{result.video_format}</Badge>}
                <Badge color={result.performance_estimate === 'hoch' ? 'bg-jb-success/10 text-jb-success' : result.performance_estimate === 'niedrig' ? 'bg-jb-danger/10 text-jb-danger' : 'bg-jb-warning/10 text-jb-warning'}>
                  {result.performance_estimate}
                </Badge>
              </div>
            </div>

            {result.why_it_works && (
              <p className="text-sm text-jb-text-secondary leading-relaxed">{result.why_it_works}</p>
            )}

            <div className="flex flex-wrap gap-2">
              {result.hook_template && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-medium border border-violet-500/20">
                  {result.hook_template}
                </span>
              )}
              {result.storytelling_framework && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                  {result.storytelling_framework}
                </span>
              )}
            </div>

            {result.niche_adaptation && (
              <div className="bg-jb-success/5 border border-jb-success/15 rounded-lg p-3">
                <p className="text-xs font-semibold text-jb-success mb-1 uppercase tracking-wider">H.I.S. Adaptation</p>
                <p className="text-sm text-jb-text leading-relaxed">{result.niche_adaptation}</p>
              </div>
            )}

            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-jb-bg border border-jb-border rounded px-1.5 py-0.5 text-jb-text-muted">#{tag}</span>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button icon={<ArrowRight size={14} />} onClick={handleUseAsIdea} className="flex-1">
                Als Idee ins Studio
              </Button>
              <Button
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={() => { setResult(null); setUrl(''); setCreatorName(''); setRawInput(''); }}
              >
                Neuen analysieren
              </Button>
              {result.source_url && (
                <a
                  href={result.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-lg border border-jb-border text-jb-text-muted hover:text-jb-accent hover:border-jb-accent/30 transition-colors flex-shrink-0"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
