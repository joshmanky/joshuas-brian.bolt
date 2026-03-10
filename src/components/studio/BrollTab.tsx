// BrollTab: B-Roll text-set generator + Canva automated workflow (upload, design, export MP4)
// Updated: compressed system prompt
import { useState, useEffect } from 'react';
import { Film, Wand2, Download, CheckCircle2, AlertCircle, Upload, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { callClaude, logAiTask } from '../../services/claude';
import {
  startCanvaOAuth,
  isCanvaConnected,
  disconnectCanva,
  runBrollWorkflow,
} from '../../services/canva/canvaService';
import type { WorkflowResult } from '../../services/canva/canvaService';

const BROLL_SYSTEM_PROMPT = `B-Roll Text-Overlay Spezialist. Generiere 5-8 kurze, emotionale oder provokante Text-Overlays (max 6-8 Woerter, keine Hashtags/Emojis/Sonderzeichen) fuer vertikales Social Media Video. Antworte NUR als JSON Array: ["Text eins","Text zwei","Text drei"]`;

const FORMAT_OPTIONS = [
  { value: 'vertical', label: '9:16 Vertikal (Reels/TikTok)' },
  { value: 'square', label: '1:1 Quadrat (Feed)' },
];

export default function BrollTab() {
  const [topic, setTopic] = useState('');
  const [texts, setTexts] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const [canvaConnected, setCanvaConnected] = useState(false);
  const [checkingCanva, setCheckingCanva] = useState(true);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [format, setFormat] = useState('vertical');
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowSteps, setWorkflowSteps] = useState<string[]>([]);
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);

  useEffect(() => {
    isCanvaConnected().then(c => {
      setCanvaConnected(c);
      setCheckingCanva(false);
    });
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'CANVA_OAUTH_SUCCESS') {
        isCanvaConnected().then(setCanvaConnected);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  async function handleGenerateTexts() {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenError(null);
    setTexts([]);
    setSelectedText('');

    try {
      const userMsg = `Generiere B-Roll Text-Overlays zum Thema: "${topic}"`;
      const result = await callClaude(BROLL_SYSTEM_PROMPT, userMsg);
      await logAiTask('B-Roll Text Agent', 'broll_text_generation', result);

      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        setTexts(parsed);
      } else {
        setGenError('Unerwartetes Format');
      }
    } catch {
      setGenError('Fehler bei der Text-Generierung');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCanvaWorkflow() {
    if (!selectedFile || !selectedText) return;
    setWorkflowLoading(true);
    setWorkflowSteps([]);
    setWorkflowResult(null);

    const result = await runBrollWorkflow(
      selectedFile,
      selectedText,
      format as 'vertical' | 'square',
      (step) => setWorkflowSteps(prev => [...prev, step])
    );

    setWorkflowResult(result);
    setWorkflowLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Text-Set Generator */}
      <div className="bg-jb-card border border-jb-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Wand2 size={16} className="text-jb-accent" />
          <h3 className="text-sm font-semibold text-jb-text">B-Roll Text-Set Generator</h3>
        </div>
        <p className="text-xs text-jb-text-muted">
          Beschreibe das Thema deines Videos. Die AI generiert kurze Text-Overlays fuer dein B-Roll Footage.
        </p>

        <div>
          <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
            Thema / Kontext
          </label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="z.B. Morgenroutine fuer Produktivitaet, Identitaetswandel durch Disziplin..."
            rows={3}
            className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
          />
        </div>

        <Button
          size="lg"
          icon={<Wand2 size={18} />}
          loading={generating}
          onClick={handleGenerateTexts}
          disabled={!topic.trim()}
          className="w-full"
        >
          {generating ? 'Generiere Texte...' : 'Text-Overlays generieren'}
        </Button>

        {genError && (
          <div className="flex items-center gap-2 text-sm text-jb-danger">
            <AlertCircle size={14} />
            {genError}
          </div>
        )}

        {texts.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-jb-text-secondary uppercase tracking-wider">
              Generierte Texte ({texts.length})
            </label>
            <div className="grid gap-2">
              {texts.map((text, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedText(text)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-all duration-200 ${
                    selectedText === text
                      ? 'bg-jb-accent/10 border-jb-accent text-jb-text font-medium'
                      : 'bg-jb-bg border-jb-border text-jb-text-muted hover:border-jb-accent/40 hover:text-jb-text'
                  }`}
                >
                  <span className="text-jb-text-muted mr-2 text-xs">{i + 1}.</span>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Canva Workflow */}
      <div className="bg-jb-card border border-jb-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film size={16} className="text-jb-accent" />
            <h3 className="text-sm font-semibold text-jb-text">Canva B-Roll Workflow</h3>
            {!checkingCanva && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                canvaConnected
                  ? 'bg-green-500/10 text-green-400'
                  : 'bg-red-500/10 text-red-400'
              }`}>
                {canvaConnected ? 'Verbunden' : 'Nicht verbunden'}
              </span>
            )}
          </div>

          {canvaConnected ? (
            <button
              onClick={() => disconnectCanva().then(() => setCanvaConnected(false))}
              className="text-xs text-jb-text-muted hover:text-red-400 transition-colors"
            >
              Trennen
            </button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                setPopupBlockedUrl(null);
                const fallbackUrl = await startCanvaOAuth();
                if (fallbackUrl) setPopupBlockedUrl(fallbackUrl);
              }}
            >
              Mit Canva verbinden
            </Button>
          )}
        </div>

        {popupBlockedUrl && !canvaConnected && (
          <div className="bg-jb-warning/5 border border-jb-warning/20 rounded-lg p-3 space-y-2">
            <p className="text-xs text-jb-warning font-medium">
              Popup wurde vom Browser blockiert. Bitte erlaube Popups oder klicke hier:
            </p>
            <a
              href={popupBlockedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-jb-accent hover:underline font-medium"
            >
              <ExternalLink size={12} />
              Canva Autorisierung oeffnen
            </a>
          </div>
        )}

        {canvaConnected && (
          <>
            <p className="text-xs text-jb-text-muted">
              Lade eine B-Roll Datei hoch und waehle einen Text. Das Dashboard erstellt automatisch ein Canva Design und exportiert es als MP4 1080p.
            </p>

            <div>
              <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
                B-Roll Video oder Bild
              </label>
              <label className="flex items-center justify-center gap-3 w-full py-6 border-2 border-dashed border-jb-border rounded-xl cursor-pointer hover:border-jb-accent/40 hover:bg-jb-accent/5 transition-all duration-200">
                <Upload size={20} className="text-jb-text-muted" />
                <span className="text-sm text-jb-text-muted">
                  {selectedFile ? selectedFile.name : 'Datei auswaehlen oder hierher ziehen'}
                </span>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
              {selectedFile && (
                <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={12} />
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            <Select
              label="Format"
              options={FORMAT_OPTIONS}
              value={format}
              onChange={e => setFormat(e.target.value)}
            />

            {texts.length === 0 && (
              <div>
                <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
                  Text-Overlay (manuell)
                </label>
                <input
                  value={selectedText}
                  onChange={e => setSelectedText(e.target.value)}
                  placeholder="Text der ueber dem B-Roll erscheint..."
                  className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
                />
              </div>
            )}

            {selectedText && (
              <div className="bg-jb-accent/5 border border-jb-accent/20 rounded-lg px-3 py-2">
                <p className="text-xs text-jb-text-secondary mb-0.5">Ausgewaehlter Text:</p>
                <p className="text-sm text-jb-text font-medium">{selectedText}</p>
              </div>
            )}

            <Button
              size="lg"
              icon={<Film size={18} />}
              loading={workflowLoading}
              onClick={handleCanvaWorkflow}
              disabled={!selectedFile || !selectedText}
              className="w-full"
            >
              {workflowLoading ? 'Workflow laeuft...' : 'B-Roll → Canva → MP4 Export'}
            </Button>

            {workflowSteps.length > 0 && (
              <div className="bg-jb-bg rounded-lg p-3 border border-jb-border space-y-1.5">
                {workflowSteps.map((step, i) => (
                  <p key={i} className="text-xs text-jb-text-muted flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-green-400 flex-shrink-0" />
                    {step}
                  </p>
                ))}
                {workflowLoading && (
                  <p className="text-xs text-jb-accent animate-pulse flex items-center gap-2">
                    <span className="inline-block w-3 h-3 border-2 border-jb-accent border-t-transparent rounded-full animate-spin" />
                    Verarbeitung laeuft...
                  </p>
                )}
              </div>
            )}

            {workflowResult && (
              <div className={`p-4 rounded-xl border ${
                workflowResult.success
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                {workflowResult.success ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Export erfolgreich!
                    </p>
                    <a
                      href={workflowResult.exportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-jb-accent hover:underline truncate"
                    >
                      <Download size={12} />
                      {workflowResult.exportUrl}
                    </a>
                    <p className="text-xs text-jb-text-muted">
                      Diese URL laeuft in 24h ab. Sofort nutzen oder downloaden.
                    </p>
                    <p className="text-xs text-jb-text-muted">Design ID: {workflowResult.designId}</p>
                  </div>
                ) : (
                  <p className="text-sm text-red-400 flex items-center gap-2">
                    <AlertCircle size={16} />
                    {workflowResult.error}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {!canvaConnected && !checkingCanva && (
          <div className="bg-jb-bg rounded-lg p-4 border border-jb-border">
            <p className="text-xs text-jb-text-muted leading-relaxed">
              Verbinde dein Canva-Konto um den vollautomatischen B-Roll Workflow zu nutzen:
              Upload → Design → MP4 Export — alles ohne Canva manuell zu oeffnen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
