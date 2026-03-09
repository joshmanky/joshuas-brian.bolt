// App: root component with router setup — added Content Research, Cross Analytics, SOP Library
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CommandCenter from './pages/CommandCenter';
import InstagramPage from './pages/InstagramPage';
import TikTokPage from './pages/TikTokPage';
import YouTubePage from './pages/YouTubePage';
import PipelinePage from './pages/PipelinePage';
import ScriptGeneratorPage from './pages/ScriptGeneratorPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ContentResearchPage from './pages/ContentResearchPage';
import CrossPlatformAnalyticsPage from './pages/CrossPlatformAnalyticsPage';
import BrainPage from './pages/BrainPage';
import SopLibraryPage from './pages/SopLibraryPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/tiktok" element={<TikTokPage />} />
          <Route path="/youtube" element={<YouTubePage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/script-generator" element={<ScriptGeneratorPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/content-research" element={<ContentResearchPage />} />
          <Route path="/cross-analytics" element={<CrossPlatformAnalyticsPage />} />
          <Route path="/brain" element={<BrainPage />} />
          <Route path="/sop-library" element={<SopLibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
