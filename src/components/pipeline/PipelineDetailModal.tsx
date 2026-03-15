// PipelineDetailModal: card detail with tabs (Skript, Caption, Media, Export, Performance)
// Updated: added Export tab, comments_48h field, scheduling auto-sets status to scheduled
import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, Calendar, Hash, Film, BarChart3, FileText, Save, Share2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ExportTab from './ExportTab';
import { updateCard } from '../../services/pipeline';
import { getMediaById } from '../../services/media';
import { HOOK_TYPE_LABELS, PIPELINE_COLUMNS } from '../../types';
import type { PipelineCard, HookType, MediaItem } from '../../types';
import { getPlatformColor } from '../../lib/utils';

interface PipelineDetailModalProps {
  card: PipelineCard | null;
  onClose: () => void;
  onUpdated: () => void;
}

const TABS = [
  { key: 'script', label: 'Skript', icon: FileText },
  { key: 'caption', label: 'Caption', icon: Hash },
  { key: 'media', label: 'Media', icon: Film },
  { key: 'export', label: 'Export', icon: Share2 },
  { key: 'performance', label: 'Performance', icon: BarChart3 },
];

export default function PipelineDetailModal({ card, onClose, onUpdated }: PipelineDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('script');
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [views48h, setViews48h] = useState('');
  const [likes48h, setLikes48h] = useState('');
  const [comments48h, setComments48h] = useState('');
  const [watchtimeScore, setWatchtimeScore] = useState('');
  const [perfSaving, setPerfSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setViews48h(String(card.views_48h || 0));
      setLikes48h(String(card.likes_48h || 0));
      setComments48h(String(card.comments_48h || 0));
      setWatchtimeScore(String(card.watchtime_score || 0));
      setActiveTab('script');
      if (card.media_id) {
        getMediaById(card.media_id).then(setMedia).catch(() => setMedia(null));
      } else {
        setMedia(null);
      }
    }
  }, [card]);

  if (!card) return null;

  const platformLabel = card.platform === 'instagram' ? 'IG' : card.platform === 'tiktok' ? 'TT' : 'YT';
  const hookLabel = HOOK_TYPE_LABELS[card.hook_type as HookType] || card.hook_type;
  const statusLabel = PIPELINE_COLUMNS.find((c) => c.key === card.status)?.label || card.status;

  async function handleCopy(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  async function handleSavePerformance() {
    if (!card) return;
    setPerfSaving(true);
    await updateCard(card.id, {
      views_48h: parseInt(views48h) || 0,
      likes_48h: parseInt(likes48h) || 0,
      comments_48h: parseInt(comments48h) || 0,
      watchtime_score: parseInt(watchtimeScore) || 0,
    });
    setPerfSaving(false);
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

        <div className="flex border-b border-jb-border overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-jb-accent text-jb-accent'
                  : 'border-transparent text-jb-text-muted hover:text-jb-text'
              }`}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'script' && (
          <ScriptTabContent card={card} copiedField={copiedField} onCopy={handleCopy} />
        )}

        {activeTab === 'caption' && (
          <CaptionTabContent card={card} copiedField={copiedField} onCopy={handleCopy} />
        )}

        {activeTab === 'media' && (
          <MediaTabContent media={media} />
        )}

        {activeTab === 'export' && (
          <ExportTab card={card} onUpdated={onUpdated} />
        )}

        {activeTab === 'performance' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <PerfField label="Views (48h)" value={views48h} onChange={setViews48h} />
              <PerfField label="Likes (48h)" value={likes48h} onChange={setLikes48h} />
              <PerfField label="Kommentare (48h)" value={comments48h} onChange={setComments48h} />
              <PerfField label="Watchtime (1-10)" value={watchtimeScore} onChange={setWatchtimeScore} max={10} />
            </div>
            <Button
              icon={<Save size={14} />}
              onClick={handleSavePerformance}
              loading={perfSaving}
              className="w-full"
            >
              Performance speichern
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function PerfField({ label, value, onChange, max }: { label: string; value: string; onChange: (v: string) => void; max?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-jb-text-secondary mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        max={max}
        className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors"
      />
    </div>
  );
}

function ScriptTabContent({ card, copiedField, onCopy }: { card: PipelineCard; copiedField: string | null; onCopy: (t: string, f: string) => void }) {
  return (
    <div className="space-y-3">
      {card.script_content ? (
        <div className="bg-jb-bg border border-jb-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-jb-border">
            <span className="text-xs font-semibold text-jb-text-secondary">Skript</span>
            <button
              onClick={() => onCopy(card.script_content!, 'script')}
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
      ) : (
        <p className="text-sm text-jb-text-muted text-center py-6">Kein Skript vorhanden.</p>
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
    </div>
  );
}

function CaptionTabContent({ card, copiedField, onCopy }: { card: PipelineCard; copiedField: string | null; onCopy: (t: string, f: string) => void }) {
  return (
    <div className="space-y-3">
      {card.caption ? (
        <div className="bg-jb-bg border border-jb-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-jb-border">
            <span className="text-xs font-semibold text-jb-text-secondary">Caption</span>
            <button
              onClick={() => onCopy(card.caption!, 'caption')}
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
      ) : (
        <p className="text-sm text-jb-text-muted text-center py-6">Keine Caption vorhanden.</p>
      )}

      {card.hashtags && (
        <div className="bg-jb-bg border border-jb-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-jb-text-secondary flex items-center gap-1">
              <Calendar size={11} /> Hashtags
            </span>
            <button
              onClick={() => onCopy(card.hashtags!, 'hashtags')}
              className="text-xs text-jb-text-muted hover:text-jb-accent transition-colors flex items-center gap-1"
            >
              {copiedField === 'hashtags' ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </div>
          <p className="text-sm text-jb-accent">{card.hashtags}</p>
        </div>
      )}
    </div>
  );
}

function MediaTabContent({ media }: { media: MediaItem | null }) {
  return (
    <div className="space-y-3">
      {media ? (
        <div className="bg-jb-bg border border-jb-border rounded-lg overflow-hidden">
          <div className="aspect-video bg-jb-border flex items-center justify-center">
            {media.type === 'image' && media.file_url ? (
              <img src={media.file_url} alt="" className="w-full h-full object-cover" />
            ) : media.thumbnail_url ? (
              <img src={media.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Film size={32} className="text-jb-text-muted" />
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-jb-text">{media.filename}</p>
            <div className="flex gap-1.5 mt-1.5">
              {media.mood && <Badge>{media.mood}</Badge>}
              {media.scene && <Badge>{media.scene}</Badge>}
            </div>
            {media.ai_description && (
              <p className="text-xs text-jb-text-secondary mt-2">{media.ai_description}</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-jb-text-muted text-center py-6">Kein Video/Bild verknuepft.</p>
      )}
    </div>
  );
}
