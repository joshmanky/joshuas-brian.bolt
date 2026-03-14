// StudioCaptionStep: Step 3 — generate caption and hashtags with Joshua-specific CTA
// Updated: uses custom caption prompt per spec, includes platform + media_id in pipeline save
import { useState } from 'react';
import { Hash, Copy, Check, ChevronDown, ChevronRight, Kanban, Wand2 } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { callClaude, logAiTask, CLAUDE_MODELS } from '../../services/claude';

interface StudioCaptionStepProps {
  isOpen: boolean;
  onToggle: () => void;
  script: string;
  platform: string;
  caption: string;
  hashtags: string;
  onCaptionGenerated: (caption: string, hashtags: string) => void;
  onSaveToPipeline: () => void;
  pipelineSaved: boolean;
  mediaId?: string | null;
}

export default function StudioCaptionStep({
  isOpen,
  onToggle,
  script,
  platform,
  caption,
  hashtags,
  onCaptionGenerated,
  onSaveToPipeline,
  pipelineSaved,
}: StudioCaptionStepProps) {
  const [loading, setLoading] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [hashtagsCopied, setHashtagsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canOpen = !!script;
  const stepDone = !!caption;

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const systemPrompt = 'Du schreibst Captions fuer Joshua (DreamChasers Industry, H.I.S.-Methode). Niemals "Network Marketing" schreiben. Immer CTA am Ende: "Schreib HIS in die Kommentare" oder "Schick mir HIS per DM".';
      const userMsg = `Schreibe eine Caption fuer ${platform} zum Skript: ${script.slice(0, 3000)}. Antworte NUR mit JSON: {"caption": "...", "hashtags": ["tag1", "tag2", ...]}`;

      const result = await callClaude(systemPrompt, userMsg, CLAUDE_MODELS.HAIKU, 400, 'Caption Agent');
      await logAiTask('Caption Agent', 'caption_generation', result);

      const cleaned = result.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const tags = Array.isArray(parsed.hashtags)
        ? parsed.hashtags.map((t: string) => t.startsWith('#') ? t : `#${t}`).join(' ')
        : parsed.hashtags || '';
      onCaptionGenerated(parsed.caption || '', tags);
    } catch {
      setError('Caption-Generierung fehlgeschlagen. Versuche es erneut.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCaption() {
    await navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  }

  async function handleCopyHashtags() {
    await navigator.clipboard.writeText(hashtags);
    setHashtagsCopied(true);
    setTimeout(() => setHashtagsCopied(false), 2000);
  }

  return (
    <div className={`bg-jb-card border rounded-xl overflow-hidden transition-all duration-300 ${
      !canOpen ? 'border-jb-border opacity-50' : stepDone && !isOpen ? 'border-jb-success/30' : isOpen ? 'border-jb-accent/40' : 'border-jb-border'
    }`}>
      <button
        onClick={canOpen ? onToggle : undefined}
        className={`w-full flex items-center justify-between px-5 py-4 transition-colors ${canOpen ? 'hover:bg-jb-card-hover cursor-pointer' : 'cursor-not-allowed'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
            stepDone ? 'bg-jb-success/20 text-jb-success' : canOpen ? 'bg-jb-accent/20 text-jb-accent' : 'bg-jb-border text-jb-text-muted'
          }`}>
            3
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-jb-text">Caption & Hashtags</h3>
            {stepDone && !isOpen && (
              <p className="text-xs text-jb-text-secondary truncate max-w-[400px]">{caption.slice(0, 60)}...</p>
            )}
          </div>
          {stepDone && !isOpen && (
            <Badge color="bg-jb-success/10 text-jb-success">Generiert</Badge>
          )}
        </div>
        {isOpen ? <ChevronDown size={16} className="text-jb-text-muted" /> : <ChevronRight size={16} className="text-jb-text-muted" />}
      </button>

      {isOpen && canOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-jb-border pt-4">
          {!caption && (
            <Button
              size="lg"
              icon={<Wand2 size={18} />}
              loading={loading}
              onClick={handleGenerate}
              className="w-full"
            >
              {loading ? 'Generiere Caption...' : 'Caption & Hashtags generieren'}
            </Button>
          )}

          {error && (
            <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3 text-sm text-jb-danger">{error}</div>
          )}

          {caption && (
            <div className="space-y-3">
              <div className="bg-jb-bg border border-jb-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider">Caption</span>
                  <button
                    onClick={handleCopyCaption}
                    className="flex items-center gap-1 text-xs text-jb-text-muted hover:text-jb-accent transition-colors"
                  >
                    {captionCopied ? <Check size={12} /> : <Copy size={12} />}
                    {captionCopied ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
                <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{caption}</p>
              </div>

              {hashtags && (
                <div className="bg-jb-bg border border-jb-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider flex items-center gap-1">
                      <Hash size={12} /> Hashtags
                    </span>
                    <button
                      onClick={handleCopyHashtags}
                      className="flex items-center gap-1 text-xs text-jb-text-muted hover:text-jb-accent transition-colors"
                    >
                      {hashtagsCopied ? <Check size={12} /> : <Copy size={12} />}
                      {hashtagsCopied ? 'Kopiert!' : 'Kopieren'}
                    </button>
                  </div>
                  <p className="text-sm text-jb-accent leading-relaxed">{hashtags}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Wand2 size={13} />}
                  onClick={handleGenerate}
                  loading={loading}
                >
                  Neu generieren
                </Button>
                <Button
                  size="sm"
                  icon={<Kanban size={13} />}
                  onClick={onSaveToPipeline}
                  disabled={pipelineSaved}
                  className="flex-1"
                >
                  {pipelineSaved ? 'In Pipeline gespeichert!' : 'Alles in Pipeline speichern'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
