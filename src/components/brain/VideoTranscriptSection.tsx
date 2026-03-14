// VideoTranscriptSection: paste content, select type, save to Brain, navigate to Studio/SOP
// Updated: added type dropdown, sessionStorage brain context for Studio integration
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Sparkles, FileText, BookOpen, Save, CheckCircle2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { saveTranscript } from '../../services/brain';

const BRAIN_CONTEXT_KEY = 'jb_brain_context';

const TYPE_OPTIONS = [
  { value: 'video_transcript', label: 'Video-Transkript' },
  { value: 'pdf_notes', label: 'PDF-Notizen' },
  { value: 'csv_data', label: 'CSV-Daten' },
  { value: 'coaching_call', label: 'Coaching-Call' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

export default function VideoTranscriptSection() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [contentType, setContentType] = useState('video_transcript');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const doc = await saveTranscript(
        title.trim() || TYPE_OPTIONS.find((t) => t.value === contentType)?.label || 'Dokument',
        text.trim(),
        contentType
      );
      if (doc) setSaved(true);
    } catch {} finally {
      setSaving(false);
    }
  }

  function handleNavigate(target: 'ideen' | 'skript' | 'sop') {
    if (target === 'ideen') {
      sessionStorage.setItem(BRAIN_CONTEXT_KEY, text.slice(0, 5000));
      navigate('/studio');
    } else if (target === 'skript') {
      sessionStorage.setItem(BRAIN_CONTEXT_KEY, text.slice(0, 5000));
      navigate(`/studio?step=skript&prefill=${encodeURIComponent(text.slice(0, 300))}`);
    } else {
      navigate('/brain?tab=sops');
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-jb-card border border-jb-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Video size={16} className="text-jb-accent" />
          <h3 className="text-sm font-semibold text-jb-text">Content einfuegen</h3>
        </div>
        <p className="text-xs text-jb-text-muted">
          Fuege dein Video-Transkript, PDF-Inhalt, CSV-Daten oder beliebigen Content ein.
          Das Brain analysiert den Text automatisch und extrahiert Zitate und Insights.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Titel (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Reel ueber Analysis Paralysis..."
          />
          <Select
            label="Typ"
            options={TYPE_OPTIONS}
            value={contentType}
            onChange={(e) => setContentType(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
            Inhalt
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Fuege hier dein Transkript, PDF-Inhalt oder beliebigen Content ein..."
            rows={8}
            className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
          />
          {text.length > 0 && (
            <p className="text-[10px] text-jb-text-muted mt-1">{text.length} Zeichen</p>
          )}
        </div>

        <Button
          icon={<Save size={16} />}
          loading={saving}
          onClick={handleSave}
          disabled={!text.trim() || saved}
          className="w-full"
        >
          {saved ? 'Gespeichert & analysiert!' : saving ? 'Wird analysiert...' : 'Im Brain speichern & analysieren'}
        </Button>
      </div>

      {saved && (
        <div className="bg-jb-card border border-jb-success/30 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-jb-success" />
            <h3 className="text-sm font-semibold text-jb-success">Gespeichert!</h3>
          </div>
          <p className="text-xs text-jb-text-secondary">
            Was willst du damit machen?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              variant="secondary"
              size="md"
              icon={<Sparkles size={15} />}
              onClick={() => handleNavigate('ideen')}
              className="w-full"
            >
              Ideen generieren
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<FileText size={15} />}
              onClick={() => handleNavigate('skript')}
              className="w-full"
            >
              Skript erstellen
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={<BookOpen size={15} />}
              onClick={() => handleNavigate('sop')}
              className="w-full"
            >
              SOP speichern
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
