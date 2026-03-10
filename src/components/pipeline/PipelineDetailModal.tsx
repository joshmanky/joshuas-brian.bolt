// PipelineDetailModal: expanded card detail view with script, caption, hashtags, canva link, date picker
// Created: shows all pipeline card fields with inline editing for scheduled_date
import { useState } from 'react';
import { ExternalLink, Copy, Check, Calendar, Hash } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { updateCard } from '../../services/pipeline';
import { HOOK_TYPE_LABELS, PIPELINE_COLUMNS } from '../../types';
import type { PipelineCard, HookType } from '../../types';
import { getPlatformColor } from '../../lib/utils';

interface PipelineDetailModalProps {
  card: PipelineCard | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function PipelineDetailModal({ card, onClose, onUpdated }: PipelineDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState(card?.scheduled_date?.split('T')[0] || '');
  const [saving, setSaving] = useState(false);

  if (!card) return null;

  const platformLabel = card.platform === 'instagram' ? 'IG' : card.platform === 'tiktok' ? 'TT' : 'YT';
  const hookLabel = HOOK_TYPE_LABELS[card.hook_type as HookType] || card.hook_type;
  const statusLabel = PIPELINE_COLUMNS.find((c) => c.key === card.status)?.label || card.status;

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleSaveDate() {
    if (!scheduledDate || !card) return;
    setSaving(true);
    await updateCard(card.id, { scheduled_date: new Date(scheduledDate).toISOString() });
    setSaving(false);
    onUpdated();
  }

  return (
    <Modal open={!!card} onClose={onClose} title={card.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge color={`${getPlatformColor(card.platform)} text-white`}>{platformLabel}</Badge>
          <Badge>{hookLabel}</Badge>
          <Badge color="bg-jb-accent/10 text-jb-accent">{statusLabel}</Badge>
        </div>

        {card.script_content && (
          <div className="bg-jb-bg border border-jb-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-jb-border">
              <span className="text-xs font-semibold text-jb-text-secondary">Skript</span>
              <button
                onClick={() => handleCopy(card.script_content!, 'script')}
                className="text-xs text-jb-text-muted hover:text-jb-accent transition-colors flex items-center gap-1"
              >
                {copiedField === 'script' ? <Check size={11} /> : <Copy size={11} />}
                {copiedField === 'script' ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div className="p-3 max-h-[200px] overflow-y-auto">
              <p className="text-sm text-jb-text whitespace-pre-wrap leading-relaxed">{card.script_content}</p>
            </div>
          </div>
        )}

        {card.caption && (
          <div className="bg-jb-bg border border-jb-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-jb-border">
              <span className="text-xs font-semibold text-jb-text-secondary">Caption</span>
              <button
                onClick={() => handleCopy(card.caption!, 'caption')}
                className="text-xs text-jb-text-muted hover:text-jb-accent transition-colors flex items-center gap-1"
              >
                {copiedField === 'caption' ? <Check size={11} /> : <Copy size={11} />}
                {copiedField === 'caption' ? 'Kopiert' : 'Kopieren'}
              </button>
            </div>
            <div className="p-3">
              <p className="text-sm text-jb-text leading-relaxed">{card.caption}</p>
            </div>
          </div>
        )}

        {card.hashtags && (
          <div className="bg-jb-bg border border-jb-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-jb-text-secondary flex items-center gap-1">
                <Hash size={11} /> Hashtags
              </span>
              <button
                onClick={() => handleCopy(card.hashtags!, 'hashtags')}
                className="text-xs text-jb-text-muted hover:text-jb-accent transition-colors flex items-center gap-1"
              >
                {copiedField === 'hashtags' ? <Check size={11} /> : <Copy size={11} />}
              </button>
            </div>
            <p className="text-sm text-jb-accent">{card.hashtags}</p>
          </div>
        )}

        {card.canva_design_url && (
          <a
            href={card.canva_design_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-jb-accent hover:underline bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5"
          >
            <ExternalLink size={14} />
            Canva Design oeffnen
          </a>
        )}

        <div className="bg-jb-bg border border-jb-border rounded-lg p-3">
          <label className="block text-xs font-semibold text-jb-text-secondary mb-1.5 flex items-center gap-1">
            <Calendar size={11} /> Posting-Datum
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="flex-1 bg-jb-card border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors"
            />
            <Button size="sm" onClick={handleSaveDate} loading={saving} disabled={!scheduledDate}>
              Speichern
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
