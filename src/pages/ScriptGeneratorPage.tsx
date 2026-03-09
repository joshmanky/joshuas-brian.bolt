// ScriptGeneratorPage: AI script generator using Claude with 5-phase structure
import { useState } from 'react';
import { Sparkles, Copy, Check, Plus, Wand2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Select from '../components/ui/Select';
import { callClaude, SCRIPT_SYSTEM_PROMPT } from '../services/claude';
import { createCard } from '../services/pipeline';
import { HOOK_TYPE_LABELS } from '../types';
import type { HookType } from '../types';

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram Reel' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'youtube', label: 'YouTube Short' },
];

const HOOK_OPTIONS = Object.entries(HOOK_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function ScriptGeneratorPage() {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [hookType, setHookType] = useState<HookType>('statement_hook');
  const [script, setScript] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToPipeline, setSavedToPipeline] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setScript('');
    setCopied(false);
    setSavedToPipeline(false);

    try {
      const platformLabel = PLATFORM_OPTIONS.find((p) => p.value === platform)?.label || platform;
      const hookLabel = HOOK_TYPE_LABELS[hookType];
      const userMessage = `Erstelle ein virales ${platformLabel} Skript zum Thema: "${topic}". Verwende einen ${hookLabel}. Formatiere klar mit den 5 Phasen: Hook, Situation, Emotion, Mehrwert/Loesung, CTA.`;
      const result = await callClaude(SCRIPT_SYSTEM_PROMPT, userMessage);
      setScript(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Generierung');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToPipeline = async () => {
    const card = await createCard({
      title: topic,
      platform,
      hook_type: hookType,
      status: 'skript_fertig',
      script_content: script,
    });
    if (card) setSavedToPipeline(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Sparkles size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">AI Script Generator</h1>
          <p className="text-sm text-jb-text-secondary">Virale Skripte mit KI generieren</p>
        </div>
      </div>

      <div className="bg-jb-card border border-jb-border rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
            Thema / Idee
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="z.B. Warum 90% der Selbststaendigen nach 2 Jahren aufgeben..."
            rows={3}
            className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Plattform"
            options={PLATFORM_OPTIONS}
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
          <Select
            label="Hook-Typ"
            options={HOOK_OPTIONS}
            value={hookType}
            onChange={(e) => setHookType(e.target.value as HookType)}
          />
        </div>

        <Button
          size="lg"
          icon={<Wand2 size={18} />}
          loading={loading}
          onClick={handleGenerate}
          disabled={!topic.trim()}
          className="w-full"
        >
          {loading ? 'Generiere Skript...' : 'Skript generieren'}
        </Button>
      </div>

      {error && (
        <div className="bg-jb-danger/5 border border-jb-danger/20 rounded-xl p-4 text-sm text-jb-danger">
          {error}
        </div>
      )}

      {script && (
        <div className="bg-jb-card border border-jb-accent/20 rounded-xl overflow-hidden accent-glow">
          <div className="flex items-center justify-between px-5 py-3 border-b border-jb-border bg-jb-accent/5">
            <span className="text-sm font-semibold text-jb-accent flex items-center gap-2">
              <Sparkles size={14} /> Generiertes Skript
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" icon={copied ? <Check size={13} /> : <Copy size={13} />} onClick={handleCopy}>
                {copied ? 'Kopiert!' : 'Kopieren'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={handleSaveToPipeline}
                disabled={savedToPipeline}
              >
                {savedToPipeline ? 'In Pipeline!' : 'Zur Pipeline'}
              </Button>
            </div>
          </div>
          <div className="p-5">
            <div className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">
              {script}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
