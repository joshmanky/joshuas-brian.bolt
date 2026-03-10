// LightbulbArchiveTab: shows all saved lightbulb editions as expandable cards
import { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getAllLightbulbEditions, deleteLightbulbEdition } from '../../services/lightbulb';
import type { LightbulbEdition } from '../../services/lightbulb';
import { formatDate } from '../../lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  Mindset: 'bg-jb-accent/10 text-jb-accent',
  Identitaet: 'bg-jb-warning/15 text-jb-warning',
  Business: 'bg-jb-success/15 text-jb-success',
  Trading: 'bg-blue-500/15 text-blue-400',
  Spiritualitaet: 'bg-jb-ig/15 text-jb-ig',
  Beziehung: 'bg-jb-tt/15 text-jb-tt',
  Sonstiges: 'bg-jb-text-muted/15 text-jb-text-secondary',
};

export default function LightbulbArchiveTab() {
  const [editions, setEditions] = useState<LightbulbEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAllLightbulbEditions().then((data) => { setEditions(data); setLoading(false); });
  }, []);

  async function handleDelete(id: string) {
    await deleteLightbulbEdition(id);
    setEditions((prev) => prev.filter((e) => e.id !== id));
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id);
  }

  if (loading) return <LoadingSpinner />;

  if (editions.length === 0) {
    return (
      <div className="text-center py-16">
        <Lightbulb size={40} className="mx-auto text-jb-text-muted mb-3" />
        <p className="text-sm text-jb-text-muted">Noch keine Lightbulb Editions gespeichert.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-jb-text-secondary">{editions.length} Editions gespeichert</p>
      {editions.map((edition) => (
        <div
          key={edition.id}
          className="bg-jb-card border border-jb-border rounded-xl overflow-hidden hover:border-jb-border-light transition-all duration-200 group"
        >
          <button
            onClick={() => toggleExpand(edition.id)}
            className="w-full flex items-center gap-3 px-5 py-4 text-left"
          >
            {expandedId === edition.id ? (
              <ChevronDown size={14} className="text-jb-text-muted flex-shrink-0" />
            ) : (
              <ChevronRight size={14} className="text-jb-text-muted flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-jb-text truncate">{edition.title}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge color={CATEGORY_COLORS[edition.category] || CATEGORY_COLORS.Sonstiges}>
                  {edition.category}
                </Badge>
                <span className="text-[10px] text-jb-text-muted">{formatDate(edition.created_at)}</span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(edition.id); }}
              className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Loeschen"
            >
              <Trash2 size={14} />
            </button>
          </button>

          {expandedId !== edition.id && (
            <div className="px-5 pb-4 -mt-1">
              <p className="text-xs text-jb-text-secondary line-clamp-2 leading-relaxed pl-7">
                {edition.content.slice(0, 150)}{edition.content.length > 150 ? '...' : ''}
              </p>
            </div>
          )}

          {expandedId === edition.id && (
            <div className="border-t border-jb-border px-5 py-4">
              <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{edition.content}</p>
              {edition.source && (
                <p className="text-xs text-jb-text-muted mt-3">Quelle: {edition.source}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
