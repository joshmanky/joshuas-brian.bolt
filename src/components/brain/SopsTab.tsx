// SopsTab: SOP Library with add modal, search, category filter, expandable cards
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, Eye } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import LoadingSpinner from '../ui/LoadingSpinner';
import { getAllSops, createSop, deleteSop } from '../../services/sop';
import { formatDate } from '../../lib/utils';
import type { SopDocument, SopCategory } from '../../types';

const CATEGORY_OPTIONS = [
  { value: 'Content', label: 'Content' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Training', label: 'Training' },
  { value: 'Tech', label: 'Tech' },
  { value: 'Sonstiges', label: 'Sonstiges' },
];

const FILTER_CHIPS: { value: string; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'Content', label: 'Content' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Training', label: 'Training' },
  { value: 'Tech', label: 'Tech' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Content: 'bg-jb-accent/10 text-jb-accent',
  Sales: 'bg-jb-ig/15 text-jb-ig',
  Operations: 'bg-jb-tt/15 text-jb-tt',
  Training: 'bg-jb-warning/15 text-jb-warning',
  Tech: 'bg-blue-500/15 text-blue-400',
  Sonstiges: 'bg-jb-text-muted/15 text-jb-text-secondary',
};

export default function SopsTab() {
  const [sops, setSops] = useState<SopDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [readingSop, setReadingSop] = useState<SopDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<SopCategory>('Content');
  const [newDescription, setNewDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSops();
  }, []);

  async function loadSops() {
    try {
      const data = await getAllSops();
      setSops(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newDescription.trim()) return;
    setSaving(true);
    try {
      const doc = await createSop({
        title: newTitle.trim(),
        category: newCategory,
        description: newDescription.trim(),
      });
      if (doc) setSops((prev) => [doc, ...prev]);
      setShowAddModal(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setNewTitle('');
    setNewCategory('Content');
    setNewDescription('');
  }

  async function handleDelete(id: string) {
    await deleteSop(id);
    setSops((prev) => prev.filter((s) => s.id !== id));
  }

  const filtered = sops.filter((s) => {
    const matchCategory = categoryFilter === 'all' || s.category === categoryFilter;
    if (!matchCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-jb-text-secondary">{sops.length} Prozesse dokumentiert</p>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowAddModal(true)}>
          Neues SOP
        </Button>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-jb-text-muted" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="SOPs durchsuchen..."
          className="w-full bg-jb-card border border-jb-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setCategoryFilter(chip.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              categoryFilter === chip.value
                ? 'bg-jb-accent/15 text-jb-accent border border-jb-accent/30'
                : 'bg-jb-card border border-jb-border text-jb-text-secondary hover:text-jb-text hover:border-jb-border-light'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-jb-text-muted mb-3" />
          <p className="text-sm text-jb-text-muted">
            {searchQuery || categoryFilter !== 'all' ? 'Keine SOPs gefunden.' : 'Noch keine SOPs erstellt.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sop) => (
            <div
              key={sop.id}
              className="bg-jb-card border border-jb-border rounded-xl p-5 hover:border-jb-border-light transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-jb-text truncate">{sop.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge color={CATEGORY_COLORS[sop.category]}>{sop.category}</Badge>
                    <span className="text-[10px] text-jb-text-muted">{formatDate(sop.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReadingSop(sop)}
                    className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-accent hover:bg-jb-accent/10 transition-colors"
                    title="Lesen"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(sop.id)}
                    className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Loeschen"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-jb-text-secondary line-clamp-3 leading-relaxed">
                {sop.description.slice(0, 100)}{sop.description.length > 100 ? '...' : ''}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title="Neues SOP erstellen">
        <div className="space-y-4">
          <Input
            label="Titel"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="z.B. Content Erstellung Workflow"
          />
          <Select
            label="Kategorie"
            options={CATEGORY_OPTIONS}
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as SopCategory)}
          />
          <div>
            <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
              Beschreibung
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={10}
              placeholder="Beschreibe den Prozess Schritt fuer Schritt..."
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>Abbrechen</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              disabled={!newTitle.trim() || !newDescription.trim()}
            >
              Erstellen
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!readingSop} onClose={() => setReadingSop(null)} title={readingSop?.title || ''}>
        {readingSop && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge color={CATEGORY_COLORS[readingSop.category]}>{readingSop.category}</Badge>
              <span className="text-xs text-jb-text-muted">{formatDate(readingSop.created_at)}</span>
            </div>
            <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{readingSop.description}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
