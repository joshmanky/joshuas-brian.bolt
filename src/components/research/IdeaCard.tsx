// IdeaCard: displays a single content research idea with platform badge and actions
import { Plus, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import type { ContentResearchItem } from '../../types';

const PLATFORM_BADGE: Record<string, { label: string; color: string }> = {
  instagram: { label: 'IG', color: 'bg-jb-ig/15 text-jb-ig' },
  tiktok: { label: 'TT', color: 'bg-jb-tt/15 text-jb-tt' },
  youtube: { label: 'YT', color: 'bg-jb-yt/15 text-jb-yt' },
};

const STATUS_COLOR: Record<string, string> = {
  New: 'bg-jb-accent/10 text-jb-accent',
  'In Pipeline': 'bg-jb-warning/10 text-jb-warning',
  Done: 'bg-jb-success/10 text-jb-success',
};

interface IdeaCardProps {
  item: ContentResearchItem;
  onAddToPipeline: (item: ContentResearchItem) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}

export default function IdeaCard({ item, onAddToPipeline, onDelete, compact }: IdeaCardProps) {
  const platformInfo = PLATFORM_BADGE[item.platform] || PLATFORM_BADGE.instagram;

  if (compact) {
    return (
      <div className="bg-jb-card border border-jb-border rounded-xl p-4 hover:border-jb-border-light transition-all duration-200 group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-jb-text truncate">{item.topic}</p>
            {item.hook_suggestion && (
              <p className="text-xs text-jb-text-secondary mt-1 line-clamp-1">{item.hook_suggestion}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge color={platformInfo.color}>{platformInfo.label}</Badge>
              <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
              <span className="text-[10px] text-jb-text-muted">
                {new Date(item.created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {item.status === 'New' && (
              <button
                onClick={() => onAddToPipeline(item)}
                className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-accent hover:bg-jb-accent/10 transition-colors"
                title="Zur Pipeline hinzufuegen"
              >
                <Plus size={14} />
              </button>
            )}
            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors"
              title="Loeschen"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-5 hover:border-jb-border-light transition-all duration-200 group">
      <div className="flex items-center gap-2 mb-3">
        <Badge color={platformInfo.color}>{platformInfo.label}</Badge>
        {item.source === 'ai_generated' && (
          <Badge color="bg-jb-accent/10 text-jb-accent">AI</Badge>
        )}
      </div>
      <h3 className="text-sm font-semibold text-jb-text mb-2 leading-snug">{item.topic}</h3>
      {item.hook_suggestion && (
        <p className="text-xs text-jb-text-secondary leading-relaxed mb-4 italic">
          "{item.hook_suggestion}"
        </p>
      )}
      <div className="flex items-center justify-between">
        <Badge color={STATUS_COLOR[item.status]}>{item.status}</Badge>
        <div className="flex items-center gap-1">
          {item.status === 'New' && (
            <button
              onClick={() => onAddToPipeline(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-jb-accent bg-jb-accent/10 hover:bg-jb-accent/20 transition-colors"
            >
              <Plus size={12} /> Pipeline
            </button>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
