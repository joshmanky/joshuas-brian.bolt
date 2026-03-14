// App: 8-hub routing + Canva OAuth callback
// Updated: added /media (Mediathek) route
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import CommandCenter from './pages/CommandCenter';
import StudioPage from './pages/StudioPage';
import PlatformsPage from './pages/PlatformsPage';
import PipelinePage from './pages/PipelinePage';
import MediaPage from './pages/MediaPage';
import BrainHubPage from './pages/BrainHubPage';
import AgentsPage from './pages/AgentsPage';
import SettingsPage from './pages/SettingsPage';
import CanvaCallbackPage from './pages/CanvaCallbackPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/oauth/callback" element={<CanvaCallbackPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<CommandCenter />} />
          <Route path="/studio" element={<StudioPage />} />
          <Route path="/platforms" element={<PlatformsPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/brain" element={<BrainHubPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
