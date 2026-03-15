// MediaGrid: responsive grid for media_library with batch selection + inline AI descriptions
// Updated: video thumbnail fallback using HTML video element with currentTime=1
import { useState } from 'react';
import { Trash2, Film, Check, Clock, User, MessageSquare } from 'lucide-react';
import Badge from '../ui/Badge';
import type { MediaItem } from '../../types';

interface MediaGridProps {
  items: MediaItem[];
  onDelete: (id: string) => void;
  onSelect?: (item: MediaItem) => void;
  selectable?: boolean;
  selectedId?: string | null;
  batchMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

const MOOD_COLORS: Record<string, string> = {
  ruhig: 'bg-blue-500/10 text-blue-400',
  energetisch: 'bg-orange-500/10 text-orange-400',
  emotional: 'bg-rose-500/10 text-rose-400',
  motivierend: 'bg-emerald-500/10 text-emerald-400',
  humorvoll: 'bg-amber-500/10 text-amber-400',
};

const SCENE_COLORS: Record<string, string> = {
  outdoor: 'bg-green-500/10 text-green-400',
  indoor: 'bg-slate-500/10 text-slate-400',
  urban: 'bg-cyan-500/10 text-cyan-400',
  travel: 'bg-teal-500/10 text-teal-400',
  gym: 'bg-red-500/10 text-red-400',
  'talking-head': 'bg-sky-500/10 text-sky-400',
  lifestyle: 'bg-pink-500/10 text-pink-400',
};

export default function MediaGrid({
  items,
  onDelete,
  onSelect,
  selectable,
  selectedId,
  batchMode,
  selectedIds,
  onToggleSelect,
  viewMode = 'grid',
}: MediaGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <Film size={36} className="mx-auto text-jb-text-muted mb-3 opacity-50" />
        <p className="text-sm text-jb-text-muted">Noch keine Medien hochgeladen.</p>
        <p className="text-xs text-jb-text-muted mt-1">Ziehe Dateien in den Upload-Bereich oben.</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-1">
        {items.map((item) => {
          const isImage = item.type === 'image';
          const isBatchSelected = batchMode && selectedIds?.has(item.id);
          return (
            <div
              key={item.id}
              onClick={() => {
                if (batchMode) onToggleSelect?.(item.id);
                else if (selectable) onSelect?.(item);
              }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                isBatchSelected ? 'bg-jb-accent/10 border border-jb-accent/30' : 'bg-jb-card border border-jb-border hover:border-jb-border-light'
              } ${batchMode || selectable ? 'cursor-pointer' : ''}`}
            >
              {batchMode && (
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  isBatchSelected ? 'bg-jb-accent border-jb-accent' : 'border-jb-border'
                }`}>
                  {isBatchSelected && <Check size={12} className="text-jb-bg" />}
                </div>
              )}

              <div className="w-10 h-10 rounded-lg bg-jb-bg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {isImage && item.file_url ? (
                  <img src={item.file_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                ) : item.thumbnail_url ? (
                  <img src={item.thumbnail_url} alt="" className="w-10 h-10 object-cover rounded-lg" />
                ) : (
                  <Film size={16} className="text-jb-text-muted" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-jb-text truncate">{item.filename}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {item.mood && <span className="text-[10px] text-jb-text-muted">{item.mood}</span>}
                  {item.scene && <span className="text-[10px] text-jb-text-muted">{item.scene}</span>}
                  {item.duration_seconds && (
                    <span className="text-[10px] text-jb-text-muted flex items-center gap-0.5">
                      <Clock size={8} />{item.duration_seconds}s
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {item.has_face && <User size={12} className="text-sky-400" />}
                {item.speaking && <MessageSquare size={12} className="text-emerald-400" />}
              </div>

              {!batchMode && !selectable && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                  className="text-jb-text-muted hover:text-jb-danger transition-colors flex-shrink-0 p-1"
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

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const isImage = item.type === 'image';
        const isSelected = selectable && selectedId === item.id;
        const isBatchSelected = batchMode && selectedIds?.has(item.id);

        return (
          <div
            key={item.id}
            className={`bg-jb-card border rounded-xl overflow-hidden group transition-all duration-200 relative ${
              isSelected || isBatchSelected
                ? 'border-jb-accent ring-1 ring-jb-accent/30'
                : 'border-jb-border hover:border-jb-border-light'
            } ${selectable || batchMode ? 'cursor-pointer' : ''}`}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (batchMode) onToggleSelect?.(item.id);
              else if (selectable) onSelect?.(item);
            }}
          >
            <div className="aspect-video bg-jb-bg flex items-center justify-center relative overflow-hidden">
              {isImage && item.file_url ? (
                <img src={item.file_url} alt={item.filename} className="w-full h-full object-cover" />
              ) : item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.filename} className="w-full h-full object-cover" />
              ) : !isImage && item.file_url ? (
                <video
                  src={item.file_url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  onLoadedData={(e) => { (e.target as HTMLVideoElement).currentTime = 1; }}
                />
              ) : (
                <Film size={28} className="text-jb-text-muted opacity-40" />
              )}

              {batchMode && (
                <div className="absolute top-2 left-2 z-10">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    isBatchSelected ? 'bg-jb-accent border-jb-accent' : 'border-white/60 bg-black/30 backdrop-blur-sm'
                  }`}>
                    {isBatchSelected && <Check size={12} className="text-jb-bg" />}
                  </div>
                </div>
              )}

              {isSelected && (
                <div className="absolute inset-0 bg-jb-accent/20 flex items-center justify-center">
                  <div className="w-8 h-8 bg-jb-accent rounded-full flex items-center justify-center">
                    <Check size={16} className="text-jb-bg" />
                  </div>
                </div>
              )}

              {item.duration_seconds && (
                <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-[10px] text-white font-mono">
                  {Math.floor(item.duration_seconds / 60)}:{String(item.duration_seconds % 60).padStart(2, '0')}
                </div>
              )}

              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {item.has_face && (
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-1">
                    <User size={10} className="text-sky-300" />
                  </div>
                )}
                {item.speaking && (
                  <div className="bg-black/60 backdrop-blur-sm rounded-full p-1">
                    <MessageSquare size={10} className="text-emerald-300" />
                  </div>
                )}
              </div>
            </div>

            <div className="p-2.5 space-y-1.5">
              <p className="text-xs font-medium text-jb-text truncate">{item.filename}</p>

              {item.ai_description && (
                <p className="text-[10px] text-jb-text-secondary leading-relaxed line-clamp-2">{item.ai_description}</p>
              )}

              <div className="flex flex-wrap gap-1">
                {item.mood && <Badge color={MOOD_COLORS[item.mood] || undefined}>{item.mood}</Badge>}
                {item.scene && <Badge color={SCENE_COLORS[item.scene] || undefined}>{item.scene}</Badge>}
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

            {hoveredId === item.id && !batchMode && !selectable && (
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
