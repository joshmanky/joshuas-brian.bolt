// ResearchPage: Link-based Content Research Hub
// 3 tabs: Link analysieren | Datenbank | Accounts
import { useState } from 'react';
import { Search, Database, Users, Link } from 'lucide-react';
import AnalyzeTab from '../components/research/AnalyzeTab';
import DatabaseTab from '../components/research/DatabaseTab';
import AccountsTab from '../components/research/AccountsTab';

const TABS = [
  { key: 'analyze', label: 'Link analysieren', icon: Link },
  { key: 'database', label: 'Datenbank', icon: Database },
  { key: 'accounts', label: 'Accounts', icon: Users },
];

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState('analyze');
  const [dbRefreshKey, setDbRefreshKey] = useState(0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Search size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Content Research Hub</h1>
          <p className="text-sm text-jb-text-secondary">Links analysieren, Datenbank aufbauen, adaptierte Ideen fuer deine Nische</p>
        </div>
      </div>

      <div className="flex border-b border-jb-border gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? 'border-jb-accent text-jb-accent'
                : 'border-transparent text-jb-text-muted hover:text-jb-text'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === 'analyze' && (
          <AnalyzeTab onAnalyzed={() => setDbRefreshKey((k) => k + 1)} />
        )}
        {activeTab === 'database' && (
          <DatabaseTab refreshKey={dbRefreshKey} />
        )}
        {activeTab === 'accounts' && (
          <AccountsTab onScraped={() => setDbRefreshKey((k) => k + 1)} />
        )}
      </div>
    </div>
  );
}
