// ExportTab: Distribution tab for pipeline cards — JSON export, copy buttons, Vista Social hint, scheduling
// Created: Export tab component extracted from PipelineDetailModal
import { useState } from 'react';
import { Download, Copy, Check, Calendar, Info, Clock } from 'lucide-react';
import Button from '../ui/Button';
import { updateCard } from '../../services/pipeline';
import type { PipelineCard } from '../../types';

interface ExportTabProps {
  card: PipelineCard;
  onUpdated: () => void;
}

export default function ExportTab({ card, onUpdated }: ExportTabProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState(card.scheduled_date?.split('T')[0] || '');
  const [saving, setSaving] = useState(false);

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleExportJson() {
    const exportData = {
      title: (card.script_content?.split('\n').find((l) => l.trim()) || card.title).slice(0, 60),
      script: card.script_content || '',
      caption: card.caption || '',
      hashtags: card.hashtags ? card.hashtags.replace(/#/g, '').split(/\s+/).filter(Boolean).join(', ') : '',
      platform: card.platform,
      scheduled_date: card.scheduled_date || '',
      media_file: '',
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.platform}_${card.hook_type}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSaveDate() {
    if (!scheduledDate) return;
    setSaving(true);
    await updateCard(card.id, {
      scheduled_date: new Date(scheduledDate).toISOString(),
      status: 'scheduled',
    });
    setSaving(false);
    onUpdated();
  }

  const captionAndHashtags = [card.caption || '', '', card.hashtags || ''].join('\n').trim();
  const allContent = [card.script_content || '', '', card.caption || '', '', card.hashtags || ''].join('\n').trim();

  return (
    <div className="space-y-4">
      <div className="bg-jb-bg border border-jb-border rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider">Export als Datei</h4>
        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={14} />}
          onClick={handleExportJson}
          className="w-full"
        >
          Als JSON exportieren
        </Button>
      </div>

      <div className="bg-jb-bg border border-jb-border rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider">Kopieren</h4>
        <div className="grid grid-cols-3 gap-2">
          <CopyButton
            label="Skript"
            text={card.script_content || ''}
            field="script"
            copiedField={copiedField}
            onCopy={handleCopy}
            disabled={!card.script_content}
          />
          <CopyButton
            label="Caption + Tags"
            text={captionAndHashtags}
            field="caption-tags"
            copiedField={copiedField}
            onCopy={handleCopy}
            disabled={!card.caption && !card.hashtags}
          />
          <CopyButton
            label="Alles"
            text={allContent}
            field="all"
            copiedField={copiedField}
            onCopy={handleCopy}
            disabled={!card.script_content && !card.caption}
          />
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
        <Info size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs text-jb-text leading-relaxed">
            <span className="font-medium">Vista Social:</span> Exportiere JSON oder kopiere Caption + Hashtags direkt.
          </p>
          <p className="text-xs text-jb-text-muted mt-1">
            Vista Social API Key in Settings eintragen fuer direktes Posting (coming soon).
          </p>
        </div>
      </div>

      <div className="bg-jb-bg border border-jb-border rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Clock size={12} /> Scheduling
        </h4>
        <div className="flex gap-2">
          <input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="flex-1 bg-jb-card border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors"
          />
          <Button size="sm" onClick={handleSaveDate} loading={saving} disabled={!scheduledDate}>
            <Calendar size={14} className="mr-1.5" />
            Planen
          </Button>
        </div>
        {card.status === 'scheduled' && card.scheduled_date && (
          <p className="text-xs text-jb-success flex items-center gap-1">
            <Check size={11} /> Geplant fuer {new Date(card.scheduled_date).toLocaleDateString('de-DE')}
          </p>
        )}
      </div>
    </div>
  );
}

function CopyButton({
  label,
  text,
  field,
  copiedField,
  onCopy,
  disabled,
}: {
  label: string;
  text: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
  disabled: boolean;
}) {
  const isCopied = copiedField === field;
  return (
    <button
      onClick={() => onCopy(text, field)}
      disabled={disabled}
      className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium border transition-colors ${
        isCopied
          ? 'border-jb-success/30 text-jb-success bg-jb-success/5'
          : disabled
            ? 'border-jb-border text-jb-text-muted opacity-50 cursor-not-allowed'
            : 'border-jb-border text-jb-text-secondary hover:border-jb-accent/30 hover:text-jb-accent hover:bg-jb-accent/5'
      }`}
    >
      {isCopied ? <Check size={11} /> : <Copy size={11} />}
      {isCopied ? 'Kopiert' : label}
    </button>
  );
}
