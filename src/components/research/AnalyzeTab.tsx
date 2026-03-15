// AnalyzeTab: Link analysis form + result card for the Research Hub
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ExternalLink, ArrowRight, RefreshCw, Wand2, Info } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { analyzeContentLink, markAsUsedIdea, type SavedContent } from '../../services/savedContent';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

function getPerfColor(est: string) {
  if (est === 'hoch') return 'bg-jb-success/10 text-jb-success';
  if (est === 'niedrig') return 'bg-jb-danger/10 text-jb-danger';
  return 'bg-jb-warning/10 text-jb-warning';
}

export default function AnalyzeTab({ onAnalyzed }: { onAnalyzed?: () => void }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [rawInput, setRawInput] = useState('');
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
      const saved = await analyzeContentLink({ url: url.trim(), creatorName: creatorName.trim(), platform, rawInput: rawInput.trim() });
      setResult(saved);
      onAnalyzed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
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
            placeholder="Fuege die Caption oder den gesprochenen Text des Videos hier ein (optional aber empfohlen fuer bessere Analyse)"
            rows={4}
            className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
          />
        </div>

        <div className="bg-jb-bg border border-jb-border rounded-lg p-3 flex items-start gap-2">
          <Info size={14} className="text-jb-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-xs text-jb-text-muted leading-relaxed">
            <span className="text-jb-text">Tipp:</span> Kopiere die Caption direkt aus Instagram/TikTok und fuege sie hier ein.
            Bei TikTok kannst du @joshmanky_bot im Kommentar taggen um das Transkript zu erhalten (coming soon).
          </p>
        </div>

        {error && (
          <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3 text-sm text-jb-danger">{error}</div>
        )}

        <Button
          size="lg"
          icon={<Wand2 size={18} />}
          loading={loading}
          onClick={handleAnalyze}
          className="w-full"
        >
          {loading ? 'Content Research Agent analysiert...' : 'Analysieren'}
        </Button>
      </div>

      {result && (
        <div className="bg-jb-card border border-jb-success/30 rounded-xl overflow-hidden">
          <div className="bg-jb-success/10 border-b border-jb-success/20 px-5 py-3 flex items-center gap-2">
            <Sparkles size={14} className="text-jb-success" />
            <span className="text-sm font-semibold text-jb-success">Analysiert und gespeichert</span>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <p className="text-xl font-bold text-jb-text leading-tight">{result.adapted_hook}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge color={`bg-jb-${result.source_platform === 'instagram' ? 'ig' : result.source_platform === 'tiktok' ? 'tt' : 'accent'}/20 text-jb-${result.source_platform === 'instagram' ? 'ig' : result.source_platform === 'tiktok' ? 'tt' : 'accent'}`}>
                  {result.source_platform}
                </Badge>
                {result.video_format && <Badge>{result.video_format}</Badge>}
                <Badge color={getPerfColor(result.performance_estimate)}>{result.performance_estimate}</Badge>
              </div>
            </div>

            {result.why_it_works && (
              <p className="text-sm text-jb-text-secondary leading-relaxed">{result.why_it_works}</p>
            )}

            {result.niche_adaptation && (
              <div className="bg-jb-success/5 border border-jb-success/15 rounded-lg p-3">
                <p className="text-xs font-semibold text-jb-success mb-1 uppercase tracking-wider">H.I.S. Adaptation</p>
                <p className="text-sm text-jb-text leading-relaxed">{result.niche_adaptation}</p>
              </div>
            )}

            {result.tags && result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <Badge key={tag} color="bg-jb-accent/5 text-jb-accent/70">#{tag}</Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                icon={<ArrowRight size={14} />}
                onClick={handleUseAsIdea}
                className="flex-1"
              >
                Als Idee ins Studio
              </Button>
              <Button
                variant="secondary"
                icon={<RefreshCw size={14} />}
                onClick={() => { setResult(null); setUrl(''); setCreatorName(''); setRawInput(''); }}
              >
                Weitere analysieren
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
