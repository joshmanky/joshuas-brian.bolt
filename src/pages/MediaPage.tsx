// MediaPage: Mediathek with bulk upload, AI Vision analysis, filters, batch editing
// Updated: complete rewrite with stats, search, view toggle, batch mode, visual upgrade
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Film,
  Search,
  LayoutGrid,
  List,
  CheckSquare,
  Filter,
  Image as ImageIcon,
  HardDrive,
  X,
} from 'lucide-react';
import MediaBulkUploader from '../components/media/MediaBulkUploader';
import MediaGrid from '../components/media/MediaGrid';
import BatchActionBar from '../components/media/BatchActionBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import {
  getAllMedia,
  uploadAndAnalyzeMedia,
  deleteMedia,
  batchUpdateMedia,
  batchDeleteMedia,
} from '../services/media';
import type { MediaItem } from '../types';

const MOOD_FILTERS = ['ruhig', 'energetisch', 'emotional', 'motivierend', 'humorvoll'];
const SCENE_FILTERS = ['outdoor', 'indoor', 'urban', 'travel', 'gym', 'talking-head', 'lifestyle'];
const TYPE_FILTERS = ['video', 'image'];

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('');
  const [filterScene, setFilterScene] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadMedia = useCallback(async () => {
    const data = await getAllMedia();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  async function handleProcessFile(
    file: File,
    onStatus: (status: string) => void,
    onProgress: (percent: number) => void
  ) {
    await uploadAndAnalyzeMedia(file, onStatus, onProgress);
  }

  async function handleDelete(id: string) {
    await deleteMedia(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBatchUpdate(updates: Partial<Pick<MediaItem, 'mood' | 'scene' | 'tags'>>) {
    const ids = Array.from(selectedIds);
    const ok = await batchUpdateMedia(ids, updates);
    if (ok) {
      setItems((prev) =>
        prev.map((item) => (ids.includes(item.id) ? { ...item, ...updates } : item))
      );
      setSelectedIds(new Set());
      setBatchMode(false);
    }
  }

  async function handleBatchDelete() {
    const ids = Array.from(selectedIds);
    const ok = await batchDeleteMedia(ids);
    if (ok) {
      setItems((prev) => prev.filter((item) => !ids.includes(item.id)));
      setSelectedIds(new Set());
      setBatchMode(false);
    }
  }

  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.filename.toLowerCase().includes(q) ||
          item.ai_description?.toLowerCase().includes(q) ||
          item.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (filterMood) result = result.filter((i) => i.mood === filterMood);
    if (filterScene) result = result.filter((i) => i.scene === filterScene);
    if (filterType) result = result.filter((i) => i.type === filterType);

    return result;
  }, [items, searchQuery, filterMood, filterScene, filterType]);

  const stats = useMemo(() => {
    const videoCount = items.filter((i) => i.type === 'video').length;
    const imageCount = items.filter((i) => i.type === 'image').length;
    const withAi = items.filter((i) => i.ai_description).length;
    return { total: items.length, videoCount, imageCount, withAi };
  }, [items]);

  const hasActiveFilters = filterMood || filterScene || filterType || searchQuery;

  function clearAllFilters() {
    setFilterMood('');
    setFilterScene('');
    setFilterType('');
    setSearchQuery('');
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
            <Film size={20} className="text-jb-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-jb-text">Mediathek</h1>
            <p className="text-sm text-jb-text-secondary">KI-analysierte Video- & Bild-Bibliothek</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatMini icon={<HardDrive size={14} />} label="Gesamt" value={stats.total} />
        <StatMini icon={<Film size={14} />} label="Videos" value={stats.videoCount} />
        <StatMini icon={<ImageIcon size={14} />} label="Bilder" value={stats.imageCount} />
        <StatMini
          icon={<span className="text-[10px] font-bold">KI</span>}
          label="Analysiert"
          value={stats.withAi}
          accent
        />
      </div>

      <MediaBulkUploader onProcessFile={handleProcessFile} onAllDone={loadMedia} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-jb-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suche nach Dateiname, Tags, Beschreibung..."
            className="w-full bg-jb-card border border-jb-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-jb-text-muted hover:text-jb-text"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-jb-accent/30 text-jb-accent bg-jb-accent/5'
                : 'border-jb-border text-jb-text-secondary hover:border-jb-border-light'
            }`}
          >
            <Filter size={12} />
            Filter
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-jb-accent" />
            )}
          </button>

          <button
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedIds(new Set());
            }}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-lg border transition-colors ${
              batchMode
                ? 'border-jb-accent/30 text-jb-accent bg-jb-accent/5'
                : 'border-jb-border text-jb-text-secondary hover:border-jb-border-light'
            }`}
          >
            <CheckSquare size={12} />
            Bearbeiten
          </button>

          <div className="flex border border-jb-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-jb-accent/10 text-jb-accent' : 'text-jb-text-muted hover:text-jb-text'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors border-l border-jb-border ${viewMode === 'list' ? 'bg-jb-accent/10 text-jb-accent' : 'text-jb-text-muted hover:text-jb-text'}`}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-4 space-y-3 animate-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-jb-text-secondary uppercase tracking-wider">Filter</span>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-xs text-jb-accent hover:text-jb-accent-dim transition-colors">
                Alle zuruecksetzen
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-jb-text-muted uppercase tracking-wider">Typ</label>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_FILTERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(filterType === t ? '' : t)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${
                    filterType === t
                      ? 'border-jb-accent/40 text-jb-accent bg-jb-accent/10'
                      : 'border-jb-border text-jb-text-secondary hover:border-jb-border-light'
                  }`}
                >
                  {t === 'video' ? 'Video' : 'Bild'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-jb-text-muted uppercase tracking-wider">Stimmung</label>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_FILTERS.map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMood(filterMood === m ? '' : m)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${
                    filterMood === m
                      ? 'border-jb-accent/40 text-jb-accent bg-jb-accent/10'
                      : 'border-jb-border text-jb-text-secondary hover:border-jb-border-light'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-jb-text-muted uppercase tracking-wider">Szene</label>
            <div className="flex flex-wrap gap-1.5">
              {SCENE_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterScene(filterScene === s ? '' : s)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${
                    filterScene === s
                      ? 'border-jb-accent/40 text-jb-accent bg-jb-accent/10'
                      : 'border-jb-border text-jb-text-secondary hover:border-jb-border-light'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-jb-text-secondary">
          <span>{filteredItems.length} von {items.length} Dateien</span>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <MediaGrid
          items={filteredItems}
          onDelete={handleDelete}
          viewMode={viewMode}
          batchMode={batchMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      )}

      {batchMode && selectedIds.size > 0 && (
        <BatchActionBar
          count={selectedIds.size}
          onCancel={() => {
            setBatchMode(false);
            setSelectedIds(new Set());
          }}
          onBatchUpdate={handleBatchUpdate}
          onBatchDelete={handleBatchDelete}
        />
      )}
    </div>
  );
}

function StatMini({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="bg-jb-card border border-jb-border rounded-xl px-3 py-2.5 flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accent ? 'bg-jb-accent/10 text-jb-accent' : 'bg-jb-bg text-jb-text-muted'}`}>
        {icon}
      </div>
      <div>
        <p className="text-base font-semibold text-jb-text stat-number">{value}</p>
        <p className="text-[10px] text-jb-text-muted uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
