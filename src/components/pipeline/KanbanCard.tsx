// KanbanCard: draggable card with performance badges, inline perf form for published cards
// Updated: new badge thresholds (>20, 10-20, <10), inline performance form, comments_48h
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Sparkles, Trash2, Calendar, Flame, TrendingUp, Minus, BarChart3 } from 'lucide-react';
import Badge from '../ui/Badge';
import { getPlatformColor } from '../../lib/utils';
import { HOOK_TYPE_LABELS } from '../../types';
import { updateCard } from '../../services/pipeline';
import type { PipelineCard, HookType } from '../../types';

interface KanbanCardProps {
  card: PipelineCard;
  mediaThumbnail?: string | null;
  onGenerateScript: (card: PipelineCard) => void;
  onDelete: (id: string) => void;
  onClick: (card: PipelineCard) => void;
  onUpdated?: () => void;
}

function getScoreBadge(likes: number | undefined) {
  if (!likes || likes === 0) return null;
  if (likes > 20) return { color: 'bg-jb-success/10 text-jb-success', icon: Flame, label: 'Fire' };
  if (likes >= 10) return { color: 'bg-jb-warning/10 text-jb-warning', icon: TrendingUp, label: 'Trend' };
  return { color: 'bg-jb-border text-jb-text-muted', icon: Minus, label: `${likes}` };
}

export default function KanbanCard({ card, mediaThumbnail, onGenerateScript, onDelete, onClick, onUpdated }: KanbanCardProps) {
  const [showPerfForm, setShowPerfForm] = useState(false);
  const [perfViews, setPerfViews] = useState(String(card.views_48h || ''));
  const [perfLikes, setPerfLikes] = useState(String(card.likes_48h || ''));
  const [perfComments, setPerfComments] = useState(String(card.comments_48h || ''));
  const [perfWatchtime, setPerfWatchtime] = useState(String(card.watchtime_score || ''));
  const [perfSaving, setPerfSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { card } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const platformLabel = card.platform === 'instagram' ? 'IG' : card.platform === 'tiktok' ? 'TT' : 'YT';
  const hookLabel = HOOK_TYPE_LABELS[card.hook_type as HookType] || card.hook_type;
  const scoreBadge = getScoreBadge(card.likes_48h);
  const isPublished = card.status === 'published';
  const hasPerf = (card.likes_48h || 0) > 0;

  async function handleSavePerf(e: React.MouseEvent) {
    e.stopPropagation();
    setPerfSaving(true);
    await updateCard(card.id, {
      views_48h: parseInt(perfViews) || 0,
      likes_48h: parseInt(perfLikes) || 0,
      comments_48h: parseInt(perfComments) || 0,
      watchtime_score: parseInt(perfWatchtime) || 0,
    });
    setPerfSaving(false);
    setShowPerfForm(false);
    onUpdated?.();
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-jb-bg border border-jb-border rounded-lg p-3 group hover:border-jb-border-light transition-colors cursor-pointer"
      onClick={() => onClick(card)}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 text-jb-text-muted hover:text-jb-text cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-jb-text truncate">{card.title}</p>
            {mediaThumbnail && (
              <div className="w-10 h-8 rounded flex-shrink-0 overflow-hidden bg-jb-border">
                <img src={mediaThumbnail} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
          {card.caption && (
            <p className="text-[11px] text-jb-text-muted mt-1 line-clamp-1">{card.caption.slice(0, 60)}</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge color={`${getPlatformColor(card.platform)} text-white`}>{platformLabel}</Badge>
            <Badge>{hookLabel}</Badge>
            {scoreBadge && (
              <Badge color={scoreBadge.color}>
                <scoreBadge.icon size={10} className="mr-0.5" />
                {scoreBadge.label}
              </Badge>
            )}
          </div>
          {card.scheduled_date && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-jb-text-muted">
              <Calendar size={10} />
              {new Date(card.scheduled_date).toLocaleDateString('de-DE')}
            </div>
          )}
        </div>
      </div>

      {isPublished && !hasPerf && !showPerfForm && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowPerfForm(true); }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-jb-accent/5 border border-jb-accent/20 text-[10px] font-medium text-jb-accent hover:bg-jb-accent/10 transition-colors"
        >
          <BarChart3 size={10} /> Performance eintragen
        </button>
      )}

      {showPerfForm && (
        <div
          className="mt-2 p-2.5 bg-jb-card border border-jb-accent/20 rounded-lg space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <PerfInput label="Views" value={perfViews} onChange={setPerfViews} />
            <PerfInput label="Likes" value={perfLikes} onChange={setPerfLikes} />
            <PerfInput label="Kommentare" value={perfComments} onChange={setPerfComments} />
            <PerfInput label="Watchtime (1-10)" value={perfWatchtime} onChange={setPerfWatchtime} />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={handleSavePerf}
              disabled={perfSaving}
              className="flex-1 py-1.5 rounded-lg bg-jb-accent text-jb-bg text-[10px] font-medium hover:bg-jb-accent-dim transition-colors disabled:opacity-50"
            >
              {perfSaving ? 'Speichern...' : 'Speichern'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowPerfForm(false); }}
              className="py-1.5 px-2.5 rounded-lg border border-jb-border text-[10px] text-jb-text-muted hover:text-jb-text transition-colors"
            >
              X
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-jb-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {card.status === 'idee' && !card.script_content && (
          <button
            onClick={(e) => { e.stopPropagation(); onGenerateScript(card); }}
            className="flex items-center gap-1 text-[10px] font-medium text-jb-accent hover:text-jb-accent-dim transition-colors"
          >
            <Sparkles size={10} /> Script generieren
          </button>
        )}
        {card.script_content && (
          <span className="text-[10px] text-jb-success">Script vorhanden</span>
        )}
        {!card.script_content && card.status !== 'idee' && <span />}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          className="text-jb-text-muted hover:text-jb-danger transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

function PerfInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[9px] text-jb-text-muted mb-0.5">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min="0"
        className="w-full bg-jb-bg border border-jb-border rounded px-2 py-1 text-[11px] text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors"
      />
    </div>
  );
}
