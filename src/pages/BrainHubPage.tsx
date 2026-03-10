// BrainHubPage: Brain & Wissen hub — Wissen + Video Transkript + Lightbulb Archiv + SOPs
// Updated: added Video Transkript tab with transcript input and Brain navigation
import { useSearchParams } from 'react-router-dom';
import { Brain, Lightbulb, BookOpen, Video } from 'lucide-react';
import TabBar from '../components/ui/TabBar';
import WissenTab from '../components/brain/WissenTab';
import VideoTranscriptSection from '../components/brain/VideoTranscriptSection';
import LightbulbArchiveTab from '../components/brain/LightbulbArchiveTab';
import SopsTab from '../components/brain/SopsTab';

const TABS = [
  { key: 'wissen', label: 'Wissen', icon: <Brain size={15} /> },
  { key: 'transkript', label: 'Video Transkript', icon: <Video size={15} /> },
  { key: 'archiv', label: 'Lightbulb Archiv', icon: <Lightbulb size={15} /> },
  { key: 'sops', label: 'SOPs', icon: <BookOpen size={15} /> },
];

export default function BrainHubPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'wissen';

  function handleTabChange(key: string) {
    setSearchParams({ tab: key });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Brain size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Brain & Wissen</h1>
          <p className="text-sm text-jb-text-secondary">Knowledge Base, Transkripte, Archiv, SOPs</p>
        </div>
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

      {activeTab === 'wissen' && <WissenTab />}
      {activeTab === 'transkript' && <VideoTranscriptSection />}
      {activeTab === 'archiv' && <LightbulbArchiveTab />}
      {activeTab === 'sops' && <SopsTab />}
    </div>
  );
}
