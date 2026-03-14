// StudioPage: Content Studio — vertical 3-step flow (Idee -> Skript -> Caption -> Pipeline)
// Updated: added video matching, brain context support, removed old Canva design button
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Zap, Film, Brain } from 'lucide-react';
import Badge from '../components/ui/Badge';
import StudioIdeaStep from '../components/studio/StudioIdeaStep';
import StudioScriptStep from '../components/studio/StudioScriptStep';
import StudioCaptionStep from '../components/studio/StudioCaptionStep';
import LightbulbTab from '../components/studio/LightbulbTab';
import BrollTab from '../components/studio/BrollTab';
import { createCard } from '../services/pipeline';
import type { ResearchItem } from '../types';

const BRAIN_CONTEXT_KEY = 'jb_brain_context';

type FlowStep = 0 | 1 | 2 | 3;

export default function StudioPage() {
  const [searchParams] = useSearchParams();
  const initialContent = searchParams.get('prefill') || '';
  const initialTab = searchParams.get('tool') || '';
  const initialStep = searchParams.get('step') || '';

  const [openStep, setOpenStep] = useState<FlowStep>(initialStep === 'skript' ? 2 : 1);
  const [selectedIdea, setSelectedIdea] = useState<ResearchItem | null>(null);
  const [script, setScript] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [hookType, setHookType] = useState('statement_hook');
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [pipelineSaved, setPipelineSaved] = useState(false);
  const [showLightbulb, setShowLightbulb] = useState(initialTab === 'lightbulb');
  const [showBroll, setShowBroll] = useState(initialTab === 'broll');
  const [brainContext, setBrainContext] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem(BRAIN_CONTEXT_KEY);
    if (stored) {
      setBrainContext(stored);
      sessionStorage.removeItem(BRAIN_CONTEXT_KEY);
    }
  }, []);

  useEffect(() => {
    if (initialContent && initialStep === 'skript') {
      const idea: ResearchItem = {
        id: `prefill-${Date.now()}`,
        title: initialContent,
        hook_type: 'statement_hook',
        platform: 'instagram',
        status: 'new',
        created_at: new Date().toISOString(),
      };
      setSelectedIdea(idea);
    }
  }, [initialContent, initialStep]);

  function handleSelectIdea(idea: ResearchItem) {
    setSelectedIdea(idea);
    setScript('');
    setCaption('');
    setHashtags('');
    setMediaId(null);
    setPipelineSaved(false);
    setOpenStep(2);
  }

  function handleScriptGenerated(newScript: string) {
    setScript(newScript);
    setCaption('');
    setHashtags('');
    setPipelineSaved(false);
  }

  function handleCaptionGenerated(newCaption: string, newHashtags: string) {
    setCaption(newCaption);
    setHashtags(newHashtags);
  }

  function handleGenerateCaption() {
    setOpenStep(3);
  }

  function handleMediaMatched(id: string) {
    setMediaId(id);
  }

  async function handleAddToPipeline() {
    const card = await createCard({
      title: selectedIdea?.title || script.split('\n').find((l) => l.trim())?.slice(0, 80) || 'Content',
      platform,
      hook_type: hookType,
      status: 'skript_fertig',
      script_content: script,
      caption: caption || undefined,
      hashtags: hashtags || undefined,
      media_id: mediaId || undefined,
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
    setMediaId(null);
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

      {brainContext && (
        <div className="max-w-3xl mx-auto bg-jb-accent/5 border border-jb-accent/20 rounded-xl px-5 py-3 flex items-center gap-2">
          <Brain size={16} className="text-jb-accent flex-shrink-0" />
          <p className="text-sm text-jb-text">Ideen basieren auf Brain-Content</p>
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-3">
        <StudioIdeaStep
          isOpen={openStep === 1}
          onToggle={() => setOpenStep(openStep === 1 ? 0 : 1)}
          selectedIdea={selectedIdea}
          onSelectIdea={handleSelectIdea}
          prefilledContent={initialContent}
        />

        <StudioScriptStep
          isOpen={openStep === 2}
          onToggle={() => setOpenStep(openStep === 2 ? 0 : 2)}
          selectedIdea={selectedIdea}
          script={script}
          onScriptGenerated={handleScriptGenerated}
          onGenerateCaption={handleGenerateCaption}
          onAddToPipeline={handleAddToPipeline}
          onMediaMatched={handleMediaMatched}
          platform={platform}
          onPlatformChange={setPlatform}
          hookType={hookType}
          onHookTypeChange={setHookType}
          brainContext={brainContext}
        />

        <StudioCaptionStep
          isOpen={openStep === 3}
          onToggle={() => setOpenStep(openStep === 3 ? 0 : 3)}
          script={script}
          platform={platform}
          caption={caption}
          hashtags={hashtags}
          onCaptionGenerated={handleCaptionGenerated}
          onSaveToPipeline={handleAddToPipeline}
          pipelineSaved={pipelineSaved}
          mediaId={mediaId}
        />

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
