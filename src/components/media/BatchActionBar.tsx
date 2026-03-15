// BatchActionBar: floating bottom bar for bulk editing selected media items
// Actions: change mood, change scene, add tags, delete selected
import { useState } from 'react';
import { Trash2, Tag, X, ChevronDown } from 'lucide-react';

const MOOD_OPTIONS = ['ruhig', 'energetisch', 'emotional', 'motivierend', 'humorvoll'];
const SCENE_OPTIONS = ['outdoor', 'indoor', 'urban', 'travel', 'gym', 'talking-head', 'lifestyle'];

interface BatchActionBarProps {
  count: number;
  onCancel: () => void;
  onBatchUpdate: (updates: { mood?: string; scene?: string; tags?: string[] }) => Promise<void>;
  onBatchDelete: () => Promise<void>;
}

type ActiveDropdown = 'mood' | 'scene' | 'tags' | null;

export default function BatchActionBar({ count, onCancel, onBatchUpdate, onBatchDelete }: BatchActionBarProps) {
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleMood(mood: string) {
    setLoading(true);
    await onBatchUpdate({ mood });
    setLoading(false);
    setActiveDropdown(null);
  }

  async function handleScene(scene: string) {
    setLoading(true);
    await onBatchUpdate({ scene });
    setLoading(false);
    setActiveDropdown(null);
  }

  async function handleTags() {
    const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (tags.length === 0) return;
    setLoading(true);
    await onBatchUpdate({ tags });
    setLoading(false);
    setActiveDropdown(null);
    setTagsInput('');
  }

  async function handleDelete() {
    if (!window.confirm(`${count} Dateien wirklich loeschen?`)) return;
    setLoading(true);
    await onBatchDelete();
    setLoading(false);
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-jb-card border border-jb-border rounded-2xl shadow-2xl shadow-black/40 px-4 py-3 flex items-center gap-3 relative">
        <span className="text-sm font-semibold text-jb-accent tabular-nums">{count}</span>
        <span className="text-sm text-jb-text-secondary">ausgewaehlt</span>

        <div className="w-px h-5 bg-jb-border" />

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'mood' ? null : 'mood')}
            disabled={loading}
            className="text-xs text-jb-text hover:text-jb-accent transition-colors px-2.5 py-1.5 rounded-lg border border-jb-border hover:border-jb-accent/30 flex items-center gap-1"
          >
            Mood <ChevronDown size={10} />
          </button>
          {activeDropdown === 'mood' && (
            <div className="absolute bottom-full mb-2 left-0 bg-jb-card border border-jb-border rounded-xl shadow-xl py-1 min-w-[140px]">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => handleMood(m)}
                  className="block w-full text-left text-xs text-jb-text hover:bg-jb-bg px-3 py-2 transition-colors capitalize"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'scene' ? null : 'scene')}
            disabled={loading}
            className="text-xs text-jb-text hover:text-jb-accent transition-colors px-2.5 py-1.5 rounded-lg border border-jb-border hover:border-jb-accent/30 flex items-center gap-1"
          >
            Szene <ChevronDown size={10} />
          </button>
          {activeDropdown === 'scene' && (
            <div className="absolute bottom-full mb-2 left-0 bg-jb-card border border-jb-border rounded-xl shadow-xl py-1 min-w-[140px]">
              {SCENE_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleScene(s)}
                  className="block w-full text-left text-xs text-jb-text hover:bg-jb-bg px-3 py-2 transition-colors capitalize"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setActiveDropdown(activeDropdown === 'tags' ? null : 'tags')}
            disabled={loading}
            className="text-xs text-jb-text hover:text-jb-accent transition-colors px-2.5 py-1.5 rounded-lg border border-jb-border hover:border-jb-accent/30 flex items-center gap-1"
          >
            <Tag size={10} /> Tags
          </button>
          {activeDropdown === 'tags' && (
            <div className="absolute bottom-full mb-2 left-0 bg-jb-card border border-jb-border rounded-xl shadow-xl p-3 min-w-[220px]">
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="tag1, tag2, tag3"
                className="w-full bg-jb-bg border border-jb-border rounded-lg px-2.5 py-1.5 text-xs text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 mb-2"
                onKeyDown={(e) => e.key === 'Enter' && handleTags()}
              />
              <button
                onClick={handleTags}
                className="w-full text-xs text-jb-bg bg-jb-accent hover:bg-jb-accent-dim rounded-lg py-1.5 font-medium transition-colors"
              >
                Tags setzen
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-jb-border" />

        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs text-jb-danger hover:text-red-300 transition-colors px-2.5 py-1.5 rounded-lg border border-jb-danger/20 hover:border-jb-danger/40 flex items-center gap-1"
        >
          <Trash2 size={10} /> Loeschen
        </button>

        <button
          onClick={onCancel}
          className="text-jb-text-muted hover:text-jb-text transition-colors p-1.5"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
