// LightbulbTab: daily AI impulse newsletter tab for Studio hub — generate, preview, archive, sources
import { useState, useEffect, useCallback } from 'react';
import { Sparkles } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';
import GenerateForm from '../lightbulb/GenerateForm';
import EditionPreview from '../lightbulb/EditionPreview';
import EditionArchive from '../lightbulb/EditionArchive';
import PlannedSources from '../lightbulb/PlannedSources';
import {
  generateLightbulb,
  saveLightbulbEdition,
  getAllLightbulbEditions,
  deleteLightbulbEdition,
} from '../../services/lightbulb';
import type { LightbulbEdition } from '../../services/lightbulb';

interface LightbulbTabProps {
  onUseAsScript: (topic: string) => void;
}

export default function LightbulbTab({ onUseAsScript }: LightbulbTabProps) {
  const [editions, setEditions] = useState<LightbulbEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedTitle, setSavedTitle] = useState('');
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
    setSavedTitle('');
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
        setSavedTitle(title);
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
      <div className="bg-jb-card border border-jb-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-jb-text mb-4">Neue Edition generieren</h3>
        <GenerateForm onGenerate={handleGenerate} loading={generating} />
      </div>

      {generating && (
        <LoadingSpinner message="Lightbulb wird generiert..." />
      )}

      {preview && !generating && (
        <div className="space-y-3">
          <EditionPreview
            content={preview.content}
            category={preview.category}
            onSave={handleSave}
            saving={saving}
            saved={saved}
          />
          {saved && savedTitle && (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={13} />}
                onClick={() => onUseAsScript(savedTitle)}
              >
                Als Skript-Idee verwenden
              </Button>
            </div>
          )}
        </div>
      )}

      <EditionArchive editions={editions} onDelete={handleDelete} />

      <PlannedSources />
    </div>
  );
}
