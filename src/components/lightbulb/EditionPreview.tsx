// EditionPreview: shows the AI-generated lightbulb edition with copy and save actions
import { useState } from 'react';
import { Copy, Check, Save } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface Props {
  content: string;
  category: string;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Mindset: 'bg-blue-500/15 text-blue-400',
  Identitaet: 'bg-jb-ig/15 text-jb-ig',
  Business: 'bg-jb-accent/10 text-jb-accent',
  Trading: 'bg-emerald-500/15 text-emerald-400',
  Spiritualitaet: 'bg-amber-500/15 text-amber-400',
  Beziehung: 'bg-rose-500/15 text-rose-400',
  Sonstiges: 'bg-jb-text-muted/15 text-jb-text-secondary',
};

export default function EditionPreview({ content, category, onSave, saving, saved }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="bg-jb-bg border border-jb-accent/20 rounded-xl p-5 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-jb-accent/60 via-jb-accent to-jb-accent/60" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-jb-text-muted font-mono">{today}</span>
          <Badge color={CATEGORY_COLORS[category] || CATEGORY_COLORS.Sonstiges}>{category}</Badge>
        </div>
      </div>

      <div className="prose-jb whitespace-pre-wrap text-sm text-jb-text leading-relaxed">
        {content}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-jb-border">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-jb-text-secondary hover:text-jb-text bg-jb-card hover:bg-jb-card-hover border border-jb-border transition-colors"
        >
          {copied ? <Check size={12} className="text-jb-success" /> : <Copy size={12} />}
          {copied ? 'Kopiert' : 'Kopieren'}
        </button>
        <Button
          variant="primary"
          size="sm"
          icon={saved ? <Check size={12} /> : <Save size={12} />}
          onClick={onSave}
          loading={saving}
          disabled={saved}
        >
          {saved ? 'Gespeichert' : 'Speichern'}
        </Button>
      </div>
    </div>
  );
}
