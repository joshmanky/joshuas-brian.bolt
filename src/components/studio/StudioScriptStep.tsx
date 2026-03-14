// StudioScriptStep: Step 2 — generate script from idea + video matching
// Updated: added "Passendes Video finden" button with AI matching from media_library
import { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Wand2, TrendingUp, ChevronDown, ChevronRight, Hash, Film, Kanban } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Badge from '../ui/Badge';
import { callClaude, logAiTask, SCRIPT_SYSTEM_PROMPT, CLAUDE_MODELS } from '../../services/claude';
import { fetchTopPerformanceData, buildPerformanceContext } from '../../services/performanceData';
import { matchVideoToScript, getMediaById } from '../../services/media';
import { HOOK_TYPE_LABELS, PLATFORM_OPTIONS } from '../../types';
import type { HookType, ResearchItem, MediaItem } from '../../types';

interface StudioScriptStepProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedIdea: ResearchItem | null;
  script: string;
  onScriptGenerated: (script: string) => void;
  onGenerateCaption: () => void;
  onAddToPipeline: () => void;
  onMediaMatched: (mediaId: string) => void;
  platform: string;
  onPlatformChange: (p: string) => void;
  hookType: string;
  onHookTypeChange: (h: string) => void;
  brainContext?: string;
}

const HOOK_OPTIONS = Object.entries(HOOK_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }));

export default function StudioScriptStep({
  isOpen,
  onToggle,
  selectedIdea,
  script,
  onScriptGenerated,
  onGenerateCaption,
  onAddToPipeline,
  onMediaMatched,
  platform,
  onPlatformChange,
  hookType,
  onHookTypeChange,
  brainContext,
}: StudioScriptStepProps) {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [perfContext, setPerfContext] = useState('');
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchedMedia, setMatchedMedia] = useState<MediaItem | null>(null);
  const [matchReason, setMatchReason] = useState('');

  useEffect(() => {
    fetchTopPerformanceData()
      .then((data) => setPerfContext(buildPerformanceContext(data)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedIdea) {
      const titlePart = selectedIdea.title.split('|')[0].trim();
      setTopic(titlePart);
      onPlatformChange(selectedIdea.platform);
      if (selectedIdea.hook_type in HOOK_TYPE_LABELS) {
        onHookTypeChange(selectedIdea.hook_type);
      }
    }
  }, [selectedIdea]);

  async function handleGenerate() {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    setMatchedMedia(null);

    try {
      const platformLabel = PLATFORM_OPTIONS.find((p) => p.value === platform)?.label || platform;
      const hookLabel = HOOK_TYPE_LABELS[hookType as HookType] || hookType;

      let userMessage = '';
      if (perfContext) {
        userMessage += `--- PERFORMANCE-DATEN ---\n${perfContext}\n--- ENDE PERFORMANCE-DATEN ---\n\n`;
      }
      if (brainContext) {
        userMessage += `--- BRAIN KONTEXT ---\n${brainContext}\n--- ENDE BRAIN KONTEXT ---\n\n`;
      }
      userMessage += `Erstelle ein virales ${platformLabel} Skript zum Thema: "${topic}". Verwende einen ${hookLabel}. Formatiere klar mit den 5 Phasen: Hook, Situation, Emotion, Mehrwert/Loesung, CTA.`;

      const result = await callClaude(SCRIPT_SYSTEM_PROMPT, userMessage, CLAUDE_MODELS.SONNET, 1000, 'Script Generation Agent');
      await logAiTask('Script Generation Agent', 'script_generation', result);
      onScriptGenerated(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Generierung');
    } finally {
      setLoading(false);
    }
  }

  async function handleMatchVideo() {
    if (!script) return;
    setMatchLoading(true);
    try {
      const hookLine = script.split('\n').find((l) => l.trim()) || topic;
      const match = await matchVideoToScript(hookLine, platform);
      if (match) {
        const media = await getMediaById(match.matched_id);
        if (media) {
          setMatchedMedia(media);
          setMatchReason(match.reason);
          onMediaMatched(media.id);
        }
      }
    } catch {} finally {
      setMatchLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepDone = !!script;
  const canOpen = !!selectedIdea;

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
            2
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-jb-text">Skript</h3>
            {stepDone && !isOpen && (
              <p className="text-xs text-jb-text-secondary truncate max-w-[400px]">
                {script.split('\n').find((l) => l.trim())?.slice(0, 60)}...
              </p>
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
          {perfContext && (
            <div className="bg-jb-success/5 border border-jb-success/20 rounded-lg p-3 flex items-start gap-2">
              <TrendingUp size={14} className="text-jb-success mt-0.5 flex-shrink-0" />
              <p className="text-xs text-jb-text-secondary">Performance-Daten werden automatisch in die Generierung einbezogen.</p>
            </div>
          )}

          {brainContext && (
            <div className="bg-jb-accent/5 border border-jb-accent/20 rounded-lg p-3 flex items-start gap-2">
              <Sparkles size={14} className="text-jb-accent mt-0.5 flex-shrink-0" />
              <p className="text-xs text-jb-text-secondary">Brain-Content wird als zusaetzlicher Kontext verwendet.</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">Thema</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="z.B. Warum 90% der Selbststaendigen nach 2 Jahren aufgeben..."
              rows={2}
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Plattform" options={PLATFORM_OPTIONS} value={platform} onChange={(e) => onPlatformChange(e.target.value)} />
            <Select label="Hook-Typ" options={HOOK_OPTIONS} value={hookType} onChange={(e) => onHookTypeChange(e.target.value)} />
          </div>

          <Button
            size="lg"
            icon={<Wand2 size={18} />}
            loading={loading}
            onClick={handleGenerate}
            disabled={!topic.trim()}
            className="w-full"
          >
            {loading ? 'Generiere Skript...' : 'Skript generieren'}
          </Button>

          {error && (
            <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-lg p-3 text-sm text-jb-danger">{error}</div>
          )}

          {script && (
            <>
              <div className="bg-jb-bg border border-jb-accent/20 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-jb-border bg-jb-accent/5">
                  <span className="text-xs font-semibold text-jb-accent flex items-center gap-1.5">
                    <Sparkles size={12} /> Generiertes Skript
                  </span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-jb-text-muted hover:text-jb-accent transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Kopiert!' : 'Kopieren'}
                  </button>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto">
                  <div className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{script}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Hash size={15} />}
                  onClick={onGenerateCaption}
                  className="w-full"
                >
                  Caption generieren
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Film size={15} />}
                  onClick={handleMatchVideo}
                  loading={matchLoading}
                  className="w-full"
                >
                  Video finden
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  icon={<Kanban size={15} />}
                  onClick={onAddToPipeline}
                  className="w-full"
                >
                  Zur Pipeline
                </Button>
              </div>

              {matchedMedia && (
                <div className="bg-jb-success/5 border border-jb-success/20 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg bg-jb-bg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {matchedMedia.type === 'image' && matchedMedia.file_url ? (
                        <img src={matchedMedia.file_url} alt="" className="w-full h-full object-cover" />
                      ) : matchedMedia.thumbnail_url ? (
                        <img src={matchedMedia.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Film size={20} className="text-jb-text-muted" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-jb-text truncate">{matchedMedia.filename}</p>
                      <p className="text-xs text-jb-text-secondary">{matchReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
