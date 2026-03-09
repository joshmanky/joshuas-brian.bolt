// SopLibraryPage: SOP document library with CRUD, search, expand
import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAllSops, createSop, deleteSop } from '../services/sop';
import { formatDate } from '../lib/utils';
import type { SopDocument, SopCategory } from '../types';

const CATEGORY_OPTIONS = [
  { value: 'Content', label: 'Content' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Training', label: 'Training' },
  { value: 'Tech', label: 'Tech' },
];

const CATEGORY_COLORS: Record<SopCategory, string> = {
  Content: 'bg-jb-accent/10 text-jb-accent',
  Sales: 'bg-jb-ig/15 text-jb-ig',
  Operations: 'bg-jb-tt/15 text-jb-tt',
  Training: 'bg-jb-warning/15 text-jb-warning',
  Tech: 'bg-blue-500/15 text-blue-400',
};

export default function SopLibraryPage() {
  const [sops, setSops] = useState<SopDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
      setShowModal(false);
      setNewTitle('');
      setNewCategory('Content');
      setNewDescription('');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteSop(id);
    setSops((prev) => prev.filter((s) => s.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  const filtered = sops.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
            <BookOpen size={20} className="text-jb-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-jb-text">SOP Library</h1>
            <p className="text-sm text-jb-text-secondary">{sops.length} Prozesse dokumentiert</p>
          </div>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto text-jb-text-muted mb-3" />
          <p className="text-sm text-jb-text-muted">
            {searchQuery ? 'Keine SOPs gefunden.' : 'Noch keine SOPs erstellt. Starte mit deinem ersten Prozess.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sop) => {
            const isExpanded = expandedId === sop.id;
            return (
              <div
                key={sop.id}
                className={`bg-jb-card border rounded-xl transition-all duration-200 ${
                  isExpanded ? 'border-jb-accent/30 col-span-1 md:col-span-2 xl:col-span-3' : 'border-jb-border hover:border-jb-border-light'
                }`}
              >
                <div className="p-5">
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
                        onClick={() => setExpandedId(isExpanded ? null : sop.id)}
                        className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-text hover:bg-jb-bg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button
                        onClick={() => handleDelete(sop.id)}
                        className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {!isExpanded && (
                    <p className="text-xs text-jb-text-secondary line-clamp-3 leading-relaxed">
                      {sop.description}
                    </p>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-jb-border">
                      <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">
                        {sop.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Neues SOP erstellen">
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
              Prozessbeschreibung
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={8}
              placeholder="Beschreibe den Prozess Schritt fuer Schritt..."
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Abbrechen
            </Button>
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
    </div>
  );
}
