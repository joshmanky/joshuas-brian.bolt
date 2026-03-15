// DatabaseTab: Research database — all saved content with filters, search, copy-to-studio
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ExternalLink, Trash2, ArrowRight, Check } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { getAllSavedContent, getSavedContentStats, markAsUsedIdea, deleteSavedContent, type SavedContent } from '../../services/savedContent';

const PLATFORM_FILTERS = ['Alle', 'instagram', 'tiktok', 'youtube'];
const PERF_FILTERS = ['Hoch', 'Noch nicht genutzt'];
const PAGE_SIZE = 20;

function getPerfColor(est: string) {
  if (est === 'hoch') return 'bg-jb-success/10 text-jb-success';
  if (est === 'niedrig') return 'bg-jb-danger/10 text-jb-danger';
  return 'bg-jb-warning/10 text-jb-warning';
}

function getPlatformShort(p: string) {
  if (p === 'instagram') return 'IG';
  if (p === 'tiktok') return 'TT';
  if (p === 'youtube') return 'YT';
  return p.slice(0, 2).toUpperCase();
}

export default function DatabaseTab({ refreshKey }: { refreshKey: number }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<SavedContent[]>([]);
  const [stats, setStats] = useState({ total: 0, today: 0, usedAsIdea: 0, highPerformance: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Alle');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getAllSavedContent(), getSavedContentStats()])
      .then(([data, s]) => { setItems(data); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let list = items;
    if (filter === 'Hoch') list = list.filter((i) => i.performance_estimate === 'hoch');
    else if (filter === 'Noch nicht genutzt') list = list.filter((i) => !i.used_as_idea);
    else if (filter !== 'Alle') list = list.filter((i) => i.source_platform === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) =>
        (i.adapted_hook || '').toLowerCase().includes(q) ||
        (i.creator_name || '').toLowerCase().includes(q) ||
        (i.hook_text || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filtered.length;

  async function handleUseAsIdea(item: SavedContent) {
    await markAsUsedIdea(item.id);
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, used_as_idea: true } : i));
    sessionStorage.setItem('research_idea', item.adapted_hook || item.hook_text || '');
    sessionStorage.setItem('research_source', item.creator_name || item.source_platform);
    sessionStorage.setItem('research_url', item.source_url || '');
    navigate('/studio');
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteSavedContent(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setDeletingId(null);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gesamt', value: stats.total },
          { label: 'Heute', value: stats.today },
          { label: 'Als Idee genutzt', value: stats.usedAsIdea },
          { label: 'Hoch performant', value: stats.highPerformance },
        ].map(({ label, value }) => (
          <div key={label} className="bg-jb-card border border-jb-border rounded-lg p-3 text-center">
            <p className="text-xl font-bold text-jb-text stat-number">{value}</p>
            <p className="text-[11px] text-jb-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {[...PLATFORM_FILTERS, ...PERF_FILTERS].map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === f
                  ? 'bg-jb-accent border-jb-accent text-jb-bg'
                  : 'bg-jb-bg border-jb-border text-jb-text-secondary hover:border-jb-accent/30 hover:text-jb-accent'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-jb-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Hook oder Creator suchen..."
            className="w-full bg-jb-bg border border-jb-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-jb-card border border-jb-border rounded-xl p-4 animate-pulse h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-jb-text-muted">
          <p className="text-sm">Keine Eintraege gefunden.</p>
          <p className="text-xs mt-1">Analysiere deinen ersten Link im Tab "Link analysieren".</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {paginated.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                onUseAsIdea={handleUseAsIdea}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-full py-2.5 text-sm text-jb-text-secondary hover:text-jb-accent border border-jb-border rounded-lg transition-colors"
            >
              Mehr laden ({filtered.length - paginated.length} weitere)
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ContentCard({
  item,
  onUseAsIdea,
  onDelete,
  deletingId,
}: {
  item: SavedContent;
  onUseAsIdea: (item: SavedContent) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-4 flex flex-col gap-3 hover:border-jb-border-light transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge color="bg-jb-accent/10 text-jb-accent">{getPlatformShort(item.source_platform)}</Badge>
          <Badge color={getPerfColor(item.performance_estimate)}>{item.performance_estimate}</Badge>
          {item.used_as_idea && (
            <Badge color="bg-jb-success/10 text-jb-success">
              <Check size={9} className="mr-0.5" /> Verwendet
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-[10px] text-jb-text-muted">
            {new Date(item.created_at).toLocaleDateString('de-DE')}
          </p>
          {item.source_url && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-jb-text-muted hover:text-jb-accent transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {item.creator_name && (
        <p className="text-xs text-jb-text-muted -mt-1">{item.creator_name}</p>
      )}

      <p className="text-base font-bold text-jb-text leading-snug">{item.adapted_hook}</p>

      {item.why_it_works && (
        <p className="text-xs text-jb-text-secondary line-clamp-1">{item.why_it_works}</p>
      )}

      {item.niche_adaptation && (
        <div className="bg-jb-success/5 border border-jb-success/15 rounded-lg p-2.5">
          <p className="text-xs text-jb-text leading-relaxed line-clamp-2">{item.niche_adaptation}</p>
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {item.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="text-[10px] bg-jb-bg border border-jb-border rounded px-1.5 py-0.5 text-jb-text-muted">#{tag}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-auto pt-1">
        <Button
          size="sm"
          icon={<ArrowRight size={12} />}
          onClick={() => onUseAsIdea(item)}
          className="flex-1"
          disabled={item.used_as_idea}
        >
          {item.used_as_idea ? 'Im Studio verwendet' : 'Als Idee ins Studio'}
        </Button>
        <button
          onClick={() => onDelete(item.id)}
          disabled={deletingId === item.id}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-jb-border text-jb-text-muted hover:text-jb-danger hover:border-jb-danger/30 transition-colors disabled:opacity-50"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
