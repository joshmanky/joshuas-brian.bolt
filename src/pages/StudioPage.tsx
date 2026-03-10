// StudioPage: Content Studio hub — Ideen + Skript + Lightbulb with cross-tab data flow
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Lightbulb, Zap } from 'lucide-react';
import TabBar from '../components/ui/TabBar';
import IdeasTab from '../components/studio/IdeasTab';
import ScriptTab from '../components/studio/ScriptTab';
import LightbulbTab from '../components/studio/LightbulbTab';

const TABS = [
  { key: 'ideen', label: 'Ideen', icon: <Lightbulb size={15} /> },
  { key: 'skript', label: 'Skript', icon: <Sparkles size={15} /> },
  { key: 'lightbulb', label: 'Lightbulb', icon: <Zap size={15} /> },
];

export default function StudioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ideen';

  const [prefilledTopic, setPrefilledTopic] = useState('');
  const [prefilledHookType, setPrefilledHookType] = useState('');
  const [prefilledPlatform, setPrefilledPlatform] = useState('');

  function setActiveTab(key: string) {
    setSearchParams({ tab: key });
  }

  function handleNavigateToScript(topic: string, hookType: string, platform: string) {
    setPrefilledTopic(topic);
    setPrefilledHookType(hookType);
    setPrefilledPlatform(platform);
    setActiveTab('skript');
  }

  function handleUseAsScript(topic: string) {
    setPrefilledTopic(topic);
    setPrefilledHookType('');
    setPrefilledPlatform('');
    setActiveTab('skript');
  }

  function handleClearPrefill() {
    setPrefilledTopic('');
    setPrefilledHookType('');
    setPrefilledPlatform('');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Sparkles size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Content Studio</h1>
          <p className="text-sm text-jb-text-secondary">Erstellen, Recherchieren, Generieren</p>
        </div>
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'ideen' && (
        <IdeasTab onNavigateToScript={handleNavigateToScript} />
      )}

      {activeTab === 'skript' && (
        <ScriptTab
          prefilledTopic={prefilledTopic}
          prefilledHookType={prefilledHookType}
          prefilledPlatform={prefilledPlatform}
          onClearPrefill={handleClearPrefill}
        />
      )}

      {activeTab === 'lightbulb' && (
        <LightbulbTab onUseAsScript={handleUseAsScript} />
      )}
    </div>
  );
}
