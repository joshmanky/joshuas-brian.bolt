// ResearchList: displays all saved research items with status badges and actions
import { Kanban, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import type { ResearchItem } from '../../types';

const HOOK_BADGE: Record<string, { label: string; color: string }> = {
  Identitaet: { label: 'Identitaet', color: 'bg-jb-ig/15 text-jb-ig' },
  Frage: { label: 'Frage', color: 'bg-jb-tt/15 text-jb-tt' },
  Zahlen: { label: 'Zahlen', color: 'bg-blue-500/15 text-blue-400' },
  Kontrast: { label: 'Kontrast', color: 'bg-jb-warning/15 text-jb-warning' },
  Statement: { label: 'Statement', color: 'bg-jb-accent/10 text-jb-accent' },
  identitaets_hook: { label: 'Identitaet', color: 'bg-jb-ig/15 text-jb-ig' },
  frage_hook: { label: 'Frage', color: 'bg-jb-tt/15 text-jb-tt' },
  zahlen_hook: { label: 'Zahlen', color: 'bg-blue-500/15 text-blue-400' },
  kontrast_hook: { label: 'Kontrast', color: 'bg-jb-warning/15 text-jb-warning' },
  statement_hook: { label: 'Statement', color: 'bg-jb-accent/10 text-jb-accent' },
};

const PLATFORM_BADGE: Record<string, { label: string; color: string }> = {
  instagram: { label: 'IG', color: 'bg-jb-ig/15 text-jb-ig' },
  tiktok: { label: 'TT', color: 'bg-jb-tt/15 text-jb-tt' },
  youtube: { label: 'YT', color: 'bg-jb-yt/15 text-jb-yt' },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: 'bg-jb-accent/10 text-jb-accent' },
  in_pipeline: { label: 'In Pipeline', color: 'bg-jb-warning/10 text-jb-warning' },
  done: { label: 'Done', color: 'bg-jb-success/10 text-jb-success' },
};

interface Props {
  items: ResearchItem[];
  onAddToPipeline: (item: ResearchItem) => void;
  onDelete: (id: string) => void;
}

export default function ResearchList({ items, onAddToPipeline, onDelete }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-sm text-jb-text-muted">
        Noch keine Ideen gespeichert.
      </div>
    );
  }

  return (
    <div className="bg-jb-card border border-jb-border rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-jb-border">
        <h3 className="text-sm font-semibold text-jb-text">Gespeicherte Ideen ({items.length})</h3>
      </div>
      <div className="divide-y divide-jb-border">
        {items.map((item) => {
          const hookInfo = HOOK_BADGE[item.hook_type] || HOOK_BADGE.Statement;
          const platInfo = PLATFORM_BADGE[item.platform] || PLATFORM_BADGE.instagram;
          const statusInfo = STATUS_BADGE[item.status] || STATUS_BADGE.new;

          return (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-jb-card-hover transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-jb-text truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge color={hookInfo.color}>{hookInfo.label}</Badge>
                  <Badge color={platInfo.color}>{platInfo.label}</Badge>
                  <Badge color={statusInfo.color}>{statusInfo.label}</Badge>
                  <span className="text-[10px] text-jb-text-muted">
                    {new Date(item.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.status === 'new' && (
                  <button
                    onClick={() => onAddToPipeline(item)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-jb-accent bg-jb-accent/10 hover:bg-jb-accent/20 transition-colors"
                  >
                    <Kanban size={12} /> Pipeline
                  </button>
                )}
                <button
                  onClick={() => onDelete(item.id)}
                  className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
