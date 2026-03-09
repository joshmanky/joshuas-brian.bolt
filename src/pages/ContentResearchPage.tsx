// ContentResearchPage: daily research ideas, manual input, AI generation, research items list
import { useState, useEffect } from 'react';
import { Search, Sparkles, Plus, Lightbulb } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import IdeaCard from '../components/research/IdeaCard';
import {
  getAllResearchItems,
  createResearchItem,
  updateResearchStatus,
  deleteResearchItem,
  generateAiIdeas,
} from '../services/contentResearch';
import { createCard } from '../services/pipeline';
import type { ContentResearchItem } from '../types';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Alle Status' },
  { value: 'New', label: 'New' },
  { value: 'In Pipeline', label: 'In Pipeline' },
  { value: 'Done', label: 'Done' },
];

export default function ContentResearchPage() {
  const [items, setItems] = useState<ContentResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newIdea, setNewIdea] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [adding, setAdding] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await getAllResearchItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddIdea() {
    if (!newIdea.trim()) return;
    setAdding(true);
    try {
      const item = await createResearchItem({
        topic: newIdea.trim(),
        platform: newPlatform,
        source: 'manual',
      });
      if (item) setItems((prev) => [item, ...prev]);
      setNewIdea('');
    } finally {
      setAdding(false);
    }
  }

  async function handleGenerateIdeas() {
    setGenerating(true);
    try {
      const newItems = await generateAiIdeas();
      setItems((prev) => [...newItems, ...prev]);
    } catch {
      // silent
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddToPipeline(item: ContentResearchItem) {
    await createCard({
      title: item.topic,
      platform: item.platform,
      hook_type: 'statement_hook',
      status: 'idee',
    });
    await updateResearchStatus(item.id, 'In Pipeline');
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'In Pipeline' as const } : i))
    );
  }

  async function handleDelete(id: string) {
    await deleteResearchItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hook_suggestion?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const aiItems = filteredItems.filter((i) => i.source === 'ai_generated' && i.status === 'New').slice(0, 6);
  const allItems = filteredItems;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Lightbulb size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Content Research</h1>
          <p className="text-sm text-jb-text-secondary">{items.length} Ideen gespeichert</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-jb-text mb-3 flex items-center gap-2">
              <Plus size={14} className="text-jb-accent" /> Neue Idee erfassen
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  value={newIdea}
                  onChange={(e) => setNewIdea(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddIdea()}
                  placeholder="Deine Content-Idee eingeben..."
                />
              </div>
              <div className="w-full sm:w-36">
                <Select
                  options={PLATFORM_OPTIONS}
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                icon={<Plus size={14} />}
                onClick={handleAddIdea}
                loading={adding}
                disabled={!newIdea.trim()}
              >
                Speichern
              </Button>
            </div>
          </div>

          <Button
            variant="secondary"
            icon={<Sparkles size={14} />}
            onClick={handleGenerateIdeas}
            loading={generating}
            className="w-full"
          >
            {generating ? 'Ideen werden generiert...' : 'Ideen mit AI generieren'}
          </Button>

          {aiItems.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-jb-text mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-jb-accent" /> AI-generierte Ideen
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiItems.map((item) => (
                  <IdeaCard
                    key={item.id}
                    item={item}
                    onAddToPipeline={handleAddToPipeline}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-jb-card border border-jb-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-jb-text-muted" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full bg-jb-bg border border-jb-border rounded-lg pl-8 pr-3 py-2 text-xs text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
                />
              </div>
            </div>
            <Select
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>

          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            <h3 className="text-xs font-semibold text-jb-text-secondary uppercase tracking-wider">
              Alle Ideen ({allItems.length})
            </h3>
            {allItems.length === 0 ? (
              <p className="text-xs text-jb-text-muted py-6 text-center">
                Noch keine Ideen gespeichert.
              </p>
            ) : (
              allItems.map((item) => (
                <IdeaCard
                  key={item.id}
                  item={item}
                  onAddToPipeline={handleAddToPipeline}
                  onDelete={handleDelete}
                  compact
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
