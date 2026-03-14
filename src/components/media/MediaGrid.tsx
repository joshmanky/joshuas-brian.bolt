// MediaGrid: display all media_library entries as a responsive grid with hover tooltips
import { useState } from 'react';
import { Trash2, Film, Image as ImageIcon } from 'lucide-react';
import Badge from '../ui/Badge';
import type { MediaItem } from '../../types';

interface MediaGridProps {
  items: MediaItem[];
  onDelete: (id: string) => void;
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
  selectedId?: string | null;
}

export default function MediaGrid({ items, onDelete, onSelect, selectable, selectedId }: MediaGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Film size={32} className="mx-auto text-jb-text-muted mb-3" />
        <p className="text-sm text-jb-text-muted">Noch keine Medien hochgeladen.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item) => {
        const isImage = item.type === 'image';
        const isSelected = selectable && selectedId === item.id;
        return (
          <div
            key={item.id}
            className={`bg-jb-card border rounded-xl overflow-hidden group transition-all duration-200 relative ${
              isSelected ? 'border-jb-accent ring-1 ring-jb-accent/30' : 'border-jb-border hover:border-jb-border-light'
            } ${selectable ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => selectable && onSelect?.(item)}
          >
            <div className="aspect-video bg-jb-bg flex items-center justify-center relative overflow-hidden">
              {isImage && item.file_url ? (
                <img src={item.file_url} alt={item.filename} className="w-full h-full object-cover" />
              ) : item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.filename} className="w-full h-full object-cover" />
              ) : (
                <Film size={32} className="text-jb-text-muted" />
              )}
              {isSelected && (
                <div className="absolute inset-0 bg-jb-accent/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-jb-accent rounded-full flex items-center justify-center">
                    <span className="text-jb-bg text-sm font-bold">&#10003;</span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 space-y-2">
              <p className="text-sm font-medium text-jb-text truncate">{item.filename}</p>
              <div className="flex flex-wrap gap-1">
                {item.mood && <Badge>{item.mood}</Badge>}
                {item.type === 'video' && <Badge color="bg-jb-accent/10 text-jb-accent">Video</Badge>}
                {item.type === 'image' && <Badge color="bg-blue-500/10 text-blue-400">Bild</Badge>}
              </div>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] text-jb-text-muted bg-jb-bg px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 3 && (
                    <span className="text-[10px] text-jb-text-muted">+{item.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {hoveredId === item.id && item.ai_description && (
              <div className="absolute bottom-full left-2 right-2 mb-1 bg-jb-bg border border-jb-border rounded-lg p-2.5 shadow-lg z-10">
                <p className="text-xs text-jb-text leading-relaxed">{item.ai_description}</p>
              </div>
            )}

            {!selectable && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="absolute top-2 right-2 bg-jb-bg/80 backdrop-blur-sm border border-jb-border rounded-lg p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-jb-text-muted hover:text-jb-danger"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
