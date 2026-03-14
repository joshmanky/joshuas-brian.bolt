// KanbanCard: draggable card with media thumbnail, caption preview, platform badge, score
// Updated: shows media thumbnail, caption preview, scheduled date, performance score badge
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Sparkles, Trash2, Film, Calendar } from 'lucide-react';
import Badge from '../ui/Badge';
import { getPlatformColor } from '../../lib/utils';
import { HOOK_TYPE_LABELS } from '../../types';
import type { PipelineCard, HookType } from '../../types';

interface KanbanCardProps {
  card: PipelineCard;
  mediaThumbnail?: string | null;
  onGenerateScript: (card: PipelineCard) => void;
  onDelete: (id: string) => void;
  onClick: (card: PipelineCard) => void;
}

function getScoreBadge(likes: number) {
  if (likes > 10) return { color: 'bg-jb-success/10 text-jb-success', label: 'Top' };
  if (likes >= 5) return { color: 'bg-jb-warning/10 text-jb-warning', label: 'OK' };
  if (likes > 0) return { color: 'bg-jb-border text-jb-text-muted', label: `${likes}` };
  return null;
}

export default function KanbanCard({ card, mediaThumbnail, onGenerateScript, onDelete, onClick }: KanbanCardProps) {
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
  const scoreBadge = getScoreBadge(card.likes_48h || 0);

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
            {scoreBadge && <Badge color={scoreBadge.color}>{scoreBadge.label}</Badge>}
          </div>
          {card.scheduled_date && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-jb-text-muted">
              <Calendar size={10} />
              {new Date(card.scheduled_date).toLocaleDateString('de-DE')}
            </div>
          )}
        </div>
      </div>
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
