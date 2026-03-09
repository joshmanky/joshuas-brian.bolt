// ResearchPage: Content Research with AI-generated ideas, manual input, saved ideas list
import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Sparkles, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ResearchIdeaGrid from '../components/research/ResearchIdeaGrid';
import ResearchForm from '../components/research/ResearchForm';
import ResearchList from '../components/research/ResearchList';
import {
  getAllResearchItems,
  createResearchItem,
  updateResearchItemStatus,
  deleteResearchItem,
  generateResearchIdeas,
} from '../services/research';
import { createCard } from '../services/pipeline';
import type { ResearchItem } from '../types';

export default function ResearchPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [aiIdeas, setAiIdeas] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      const data = await getAllResearchItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
    handleGenerate();
  }, [loadItems]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const ideas = await generateResearchIdeas();
      setAiIdeas(ideas);
      setItems((prev) => [...ideas, ...prev]);
    } catch {
      // silent — edge function may not have Claude key
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveIdea(title: string, hookType: string, platform: string) {
    const item = await createResearchItem({ title, hook_type: hookType, platform });
    if (item) setItems((prev) => [item, ...prev]);
  }

  async function handleAddToPipeline(item: ResearchItem) {
    await createCard({
      title: item.title,
      platform: item.platform,
      hook_type: item.hook_type,
      status: 'idee',
    });
    await updateResearchItemStatus(item.id, 'in_pipeline');
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'in_pipeline' as const } : i)));
    setAiIdeas((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'in_pipeline' as const } : i)));
  }

  async function handleGenerateScript(item: ResearchItem) {
    navigate(`/script-generator?title=${encodeURIComponent(item.title)}`);
  }

  async function handleDelete(id: string) {
    await deleteResearchItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    setAiIdeas((prev) => prev.filter((i) => i.id !== id));
  }

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

      <div className="bg-jb-card border border-jb-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-jb-text flex items-center gap-2">
            <Sparkles size={14} className="text-jb-accent" />
            Ideen aus Performance
          </h3>
          {!generating && (
            <button
              onClick={handleGenerate}
              className="text-xs text-jb-text-secondary hover:text-jb-accent transition-colors"
            >
              Neu generieren
            </button>
          )}
        </div>
        {generating ? (
          <div className="py-8">
            <LoadingSpinner message="AI analysiert Top-Posts und generiert Ideen..." />
          </div>
        ) : aiIdeas.length > 0 ? (
          <ResearchIdeaGrid
            ideas={aiIdeas}
            onAddToPipeline={handleAddToPipeline}
            onGenerateScript={handleGenerateScript}
          />
        ) : (
          <div className="text-center py-8 text-sm text-jb-text-muted">
            Klicke "Neu generieren" um AI-Ideen basierend auf deinen Top-Posts zu erstellen.
          </div>
        )}
      </div>

      <div className="bg-jb-card border border-jb-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-jb-text mb-3 flex items-center gap-2">
          <FileText size={14} className="text-jb-accent" />
          Eigene Idee
        </h3>
        <ResearchForm onSave={handleSaveIdea} />
      </div>

      <ResearchList
        items={items}
        onAddToPipeline={handleAddToPipeline}
        onDelete={handleDelete}
      />
    </div>
  );
}
