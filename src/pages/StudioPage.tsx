// StudioPage: Content Studio — vertical step-by-step flow (Idee -> Skript -> Caption -> Pipeline)
// Updated: replaced tab-based approach with collapsible 3-step flow + Lightbulb and B-Roll tools
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Zap, Film, ExternalLink } from 'lucide-react';
import Badge from '../components/ui/Badge';
import StudioIdeaStep from '../components/studio/StudioIdeaStep';
import StudioScriptStep from '../components/studio/StudioScriptStep';
import StudioCaptionStep from '../components/studio/StudioCaptionStep';
import LightbulbTab from '../components/studio/LightbulbTab';
import BrollTab from '../components/studio/BrollTab';
import { createCard } from '../services/pipeline';
import { logAiTask } from '../services/claude';
import { createCanvaDesign, isCanvaConnected } from '../services/canva/canvaService';
import type { ResearchItem } from '../types';

type FlowStep = 1 | 2 | 3;

export default function StudioPage() {
  const [searchParams] = useSearchParams();
  const initialContent = searchParams.get('prefill') || '';
  const initialTab = searchParams.get('tool') || '';

  const [openStep, setOpenStep] = useState<FlowStep>(1);
  const [selectedIdea, setSelectedIdea] = useState<ResearchItem | null>(null);
  const [script, setScript] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [hookType, setHookType] = useState('statement_hook');
  const [pipelineSaved, setPipelineSaved] = useState(false);
  const [canvaLoading, setCanvaLoading] = useState(false);
  const [canvaDesignUrl, setCanvaDesignUrl] = useState('');
  const [showLightbulb, setShowLightbulb] = useState(initialTab === 'lightbulb');
  const [showBroll, setShowBroll] = useState(initialTab === 'broll');

  function handleSelectIdea(idea: ResearchItem) {
    setSelectedIdea(idea);
    setScript('');
    setCaption('');
    setHashtags('');
    setPipelineSaved(false);
    setCanvaDesignUrl('');
    setOpenStep(2);
  }

  function handleScriptGenerated(newScript: string) {
    setScript(newScript);
    setCaption('');
    setHashtags('');
    setPipelineSaved(false);
    setCanvaDesignUrl('');
  }

  function handleCaptionGenerated(newCaption: string, newHashtags: string) {
    setCaption(newCaption);
    setHashtags(newHashtags);
  }

  function handleGenerateCaption() {
    setOpenStep(3);
  }

  async function handleCreateCanvaDesign() {
    setCanvaLoading(true);
    try {
      const connected = await isCanvaConnected();
      if (!connected) {
        alert('Bitte zuerst Canva verbinden (unter Studio > B-Roll Tools).');
        setCanvaLoading(false);
        return;
      }
      const hookLine = script.split('\n').find((l) => l.trim()) || selectedIdea?.title || 'Content';
      const result = await createCanvaDesign(hookLine, platform);
      if (result) {
        setCanvaDesignUrl(result.designUrl);
        await logAiTask('Canva Design Agent', 'canva_design_creation', `Design erstellt: ${result.designId}`);
      }
    } catch {
      alert('Canva Design konnte nicht erstellt werden.');
    } finally {
      setCanvaLoading(false);
    }
  }

  async function handleAddToPipeline() {
    const card = await createCard({
      title: selectedIdea?.title || script.split('\n').find((l) => l.trim())?.slice(0, 80) || 'Content',
      platform,
      hook_type: hookType,
      status: caption ? 'skript_fertig' : 'skript_fertig',
      script_content: script,
      caption: caption || undefined,
      hashtags: hashtags || undefined,
      canva_design_url: canvaDesignUrl || undefined,
    });
    if (card) setPipelineSaved(true);
  }

  function handleLightbulbUseAsScript(topic: string) {
    setSelectedIdea({
      id: `lb-${Date.now()}`,
      title: topic,
      hook_type: 'statement_hook',
      platform: 'instagram',
      status: 'new',
      created_at: new Date().toISOString(),
    });
    setScript('');
    setCaption('');
    setHashtags('');
    setPipelineSaved(false);
    setOpenStep(2);
    setShowLightbulb(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Sparkles size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Content Studio</h1>
          <p className="text-sm text-jb-text-secondary">Idee &rarr; Skript &rarr; Caption &rarr; Pipeline</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        <StudioIdeaStep
          isOpen={openStep === 1}
          onToggle={() => setOpenStep(openStep === 1 ? 0 as FlowStep : 1)}
          selectedIdea={selectedIdea}
          onSelectIdea={handleSelectIdea}
          prefilledContent={initialContent}
        />

        <StudioScriptStep
          isOpen={openStep === 2}
          onToggle={() => setOpenStep(openStep === 2 ? 0 as FlowStep : 2)}
          selectedIdea={selectedIdea}
          script={script}
          onScriptGenerated={handleScriptGenerated}
          onGenerateCaption={handleGenerateCaption}
          onCreateCanvaDesign={handleCreateCanvaDesign}
          onAddToPipeline={handleAddToPipeline}
          platform={platform}
          onPlatformChange={setPlatform}
          hookType={hookType}
          onHookTypeChange={setHookType}
        />

        <StudioCaptionStep
          isOpen={openStep === 3}
          onToggle={() => setOpenStep(openStep === 3 ? 0 as FlowStep : 3)}
          script={script}
          caption={caption}
          hashtags={hashtags}
          onCaptionGenerated={handleCaptionGenerated}
          onSaveToPipeline={handleAddToPipeline}
          pipelineSaved={pipelineSaved}
        />

        {canvaLoading && (
          <div className="bg-jb-card border border-jb-accent/30 rounded-xl px-5 py-3 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-jb-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-jb-accent font-medium">Canva Design wird erstellt...</span>
          </div>
        )}

        {canvaDesignUrl && (
          <div className="bg-jb-success/5 border border-jb-success/20 rounded-xl px-5 py-3 flex items-center justify-between">
            <span className="text-sm text-jb-success font-medium">Canva Design erstellt!</span>
            <a
              href={canvaDesignUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-jb-accent hover:underline font-medium"
            >
              <ExternalLink size={12} /> In Canva oeffnen
            </a>
          </div>
        )}

        {pipelineSaved && (
          <div className="bg-jb-success/5 border border-jb-success/20 rounded-xl px-5 py-3 text-center">
            <p className="text-sm text-jb-success font-medium">Alles in der Pipeline gespeichert!</p>
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto space-y-3 pt-4">
        <div className="flex items-center gap-2 text-xs text-jb-text-muted uppercase tracking-wider font-medium">
          Weitere Tools
        </div>

        <button
          onClick={() => { setShowLightbulb(!showLightbulb); setShowBroll(false); }}
          className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200 text-left ${
            showLightbulb ? 'bg-jb-card border-jb-accent/30' : 'bg-jb-card border-jb-border hover:border-jb-border-light'
          }`}
        >
          <Zap size={16} className="text-jb-accent" />
          <span className="text-sm font-medium text-jb-text">Lightbulb Newsletter</span>
          <Badge>Tool</Badge>
        </button>

        {showLightbulb && (
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <LightbulbTab onUseAsScript={handleLightbulbUseAsScript} />
          </div>
        )}

        <button
          onClick={() => { setShowBroll(!showBroll); setShowLightbulb(false); }}
          className={`w-full flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-200 text-left ${
            showBroll ? 'bg-jb-card border-jb-accent/30' : 'bg-jb-card border-jb-border hover:border-jb-border-light'
          }`}
        >
          <Film size={16} className="text-jb-accent" />
          <span className="text-sm font-medium text-jb-text">B-Roll Tools</span>
          <Badge>Tool</Badge>
        </button>

        {showBroll && (
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <BrollTab />
          </div>
        )}
      </div>
    </div>
  );
}
