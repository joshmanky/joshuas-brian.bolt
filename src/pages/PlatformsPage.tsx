// PlatformsPage: combined platform hub — Uebersicht + Instagram + TikTok + YouTube
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Instagram, Music2, Youtube } from 'lucide-react';
import TabBar from '../components/ui/TabBar';
import OverviewTab from '../components/platforms/OverviewTab';
import InstagramTab from '../components/platforms/InstagramTab';
import TikTokTab from '../components/platforms/TikTokTab';
import YouTubeTab from '../components/platforms/YouTubeTab';

const TABS = [
  { key: 'uebersicht', label: 'Uebersicht', icon: <BarChart3 size={15} /> },
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={15} /> },
  { key: 'tiktok', label: 'TikTok', icon: <Music2 size={15} /> },
  { key: 'youtube', label: 'YouTube', icon: <Youtube size={15} /> },
];

export default function PlatformsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'uebersicht';

  function handleTabChange(key: string) {
    setSearchParams({ tab: key });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <BarChart3 size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Plattformen</h1>
          <p className="text-sm text-jb-text-secondary">Performance und Analytics</p>
        </div>
      </div>

      <TabBar tabs={TABS} activeTab={activeTab} onChange={handleTabChange} />

      {activeTab === 'uebersicht' && <OverviewTab />}
      {activeTab === 'instagram' && <InstagramTab />}
      {activeTab === 'tiktok' && <TikTokTab />}
      {activeTab === 'youtube' && <YouTubeTab />}
    </div>
  );
}
