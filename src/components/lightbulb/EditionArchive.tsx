// EditionArchive: browsable list of all saved lightbulb editions with filters and search
import { useState, useMemo } from 'react';
import { Trash2, BookOpen, Search } from 'lucide-react';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { LIGHTBULB_CATEGORIES } from '../../services/lightbulb';
import type { LightbulbEdition } from '../../services/lightbulb';

interface Props {
  editions: LightbulbEdition[];
  onDelete: (id: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Mindset: 'bg-blue-500/15 text-blue-400',
  Identitaet: 'bg-jb-ig/15 text-jb-ig',
  Business: 'bg-jb-accent/10 text-jb-accent',
  Trading: 'bg-emerald-500/15 text-emerald-400',
  Spiritualitaet: 'bg-amber-500/15 text-amber-400',
  Beziehung: 'bg-rose-500/15 text-rose-400',
  Sonstiges: 'bg-jb-text-muted/15 text-jb-text-secondary',
};

const FILTER_CATEGORIES = ['Alle', ...LIGHTBULB_CATEGORIES.filter((c) => c !== 'Sonstiges' && c !== 'Beziehung')];

export default function EditionArchive({ editions, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [reading, setReading] = useState<LightbulbEdition | null>(null);

  const filtered = useMemo(() => {
    let list = editions;
    if (activeCategory !== 'Alle') {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [editions, activeCategory, search]);

  return (
    <>
      <div className="bg-jb-card border border-jb-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-jb-border space-y-3">
          <h3 className="text-sm font-semibold text-jb-text">Archiv ({editions.length})</h3>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-jb-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Suche nach Titel oder Inhalt..."
              className="w-full bg-jb-bg border border-jb-border rounded-lg pl-9 pr-3 py-2 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === cat
                    ? 'bg-jb-accent/15 text-jb-accent'
                    : 'text-jb-text-muted hover:text-jb-text-secondary hover:bg-jb-bg'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-jb-text-muted">
            {editions.length === 0
              ? 'Noch keine Editionen gespeichert.'
              : 'Keine Ergebnisse fuer diese Filter.'}
          </div>
        ) : (
          <div className="divide-y divide-jb-border">
            {filtered.map((edition) => (
              <div
                key={edition.id}
                className="flex items-start gap-4 px-5 py-4 hover:bg-jb-card-hover transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-jb-text-muted font-mono">
                      {new Date(edition.created_at).toLocaleDateString('de-DE')}
                    </span>
                    <Badge color={CATEGORY_COLORS[edition.category] || CATEGORY_COLORS.Sonstiges}>
                      {edition.category}
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-jb-text mb-1 truncate">{edition.title}</p>
                  <p className="text-xs text-jb-text-secondary line-clamp-2">
                    {edition.content.slice(0, 100)}
                    {edition.content.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                  <button
                    onClick={() => setReading(edition)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-jb-accent bg-jb-accent/10 hover:bg-jb-accent/20 transition-colors"
                  >
                    <BookOpen size={12} /> Lesen
                  </button>
                  <button
                    onClick={() => onDelete(edition.id)}
                    className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!reading}
        onClose={() => setReading(null)}
        title={reading?.title || ''}
      >
        {reading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-jb-text-muted font-mono">
                {new Date(reading.created_at).toLocaleDateString('de-DE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <Badge color={CATEGORY_COLORS[reading.category] || CATEGORY_COLORS.Sonstiges}>
                {reading.category}
              </Badge>
            </div>
            {reading.source && (
              <p className="text-xs text-jb-text-muted">
                Quelle: <span className="text-jb-text-secondary">{reading.source}</span>
              </p>
            )}
            <div className="whitespace-pre-wrap text-sm text-jb-text leading-relaxed pt-2 border-t border-jb-border">
              {reading.content}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
