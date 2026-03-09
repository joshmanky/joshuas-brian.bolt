// LightbulbLabPage: daily AI-generated impulse newsletter, archive, and planned sources
import { useState, useEffect, useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import GenerateForm from '../components/lightbulb/GenerateForm';
import EditionPreview from '../components/lightbulb/EditionPreview';
import EditionArchive from '../components/lightbulb/EditionArchive';
import PlannedSources from '../components/lightbulb/PlannedSources';
import {
  generateLightbulb,
  saveLightbulbEdition,
  getAllLightbulbEditions,
  deleteLightbulbEdition,
} from '../services/lightbulb';
import type { LightbulbEdition } from '../services/lightbulb';

export default function LightbulbLabPage() {
  const [editions, setEditions] = useState<LightbulbEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<{
    content: string;
    category: string;
    source: string;
    rawInput: string;
  } | null>(null);

  const loadEditions = useCallback(async () => {
    try {
      const data = await getAllLightbulbEditions();
      setEditions(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEditions();
  }, [loadEditions]);

  async function handleGenerate(thema: string, quelle: string, gedanke: string, kategorie: string) {
    setGenerating(true);
    setPreview(null);
    setSaved(false);
    try {
      const content = await generateLightbulb(thema, quelle, gedanke, kategorie);
      setPreview({ content, category: kategorie, source: quelle, rawInput: gedanke });
    } catch {
      setPreview(null);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!preview) return;
    setSaving(true);
    try {
      const firstLine = preview.content.split('\n').find((l) => l.trim()) || 'Lightbulb Edition';
      const title = firstLine.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, '').slice(0, 100);
      const edition = await saveLightbulbEdition({
        title,
        content: preview.content,
        category: preview.category,
        source: preview.source,
        raw_input: preview.rawInput,
      });
      if (edition) {
        setEditions((prev) => [edition, ...prev]);
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteLightbulbEdition(id);
    setEditions((prev) => prev.filter((e) => e.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Lightbulb size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Lightbulb Lab</h1>
          <p className="text-sm text-jb-text-secondary">
            Dein taeglicher Impuls-Newsletter -- geschrieben von dir, fuer dich.
          </p>
        </div>
      </div>

      <div className="bg-jb-card border border-jb-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-jb-text mb-4">Neue Edition generieren</h3>
        <GenerateForm onGenerate={handleGenerate} loading={generating} />
      </div>

      {generating && (
        <LoadingSpinner message="Lightbulb wird generiert..." />
      )}

      {preview && !generating && (
        <EditionPreview
          content={preview.content}
          category={preview.category}
          onSave={handleSave}
          saving={saving}
          saved={saved}
        />
      )}

      <EditionArchive editions={editions} onDelete={handleDelete} />

      <PlannedSources />
    </div>
  );
}
