import { useState } from 'react';
import { Search, Database, Users, Link, BookOpen } from 'lucide-react';
import AnalyzeTab from '../components/research/AnalyzeTab';
import DatabaseTab from '../components/research/DatabaseTab';
import AccountsTab from '../components/research/AccountsTab';
import HookTemplatesTab from '../components/research/HookTemplatesTab';

const TABS = [
  { key: 'analyze', label: 'Link analysieren', icon: Link },
  { key: 'database', label: 'Datenbank', icon: Database },
  { key: 'templates', label: 'Hook-Templates', icon: BookOpen },
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
          <p className="text-sm text-jb-text-secondary">Links analysieren, Hooks systematisieren, Datenbank aufbauen</p>
        </div>
      </div>

      <div className="flex border-b border-jb-border gap-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap flex-shrink-0 ${
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
        {activeTab === 'templates' && (
          <HookTemplatesTab />
        )}
        {activeTab === 'accounts' && (
          <AccountsTab onScraped={() => setDbRefreshKey((k) => k + 1)} />
        )}
      </div>
    </div>
  );
}
