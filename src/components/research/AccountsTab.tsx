// AccountsTab: Watch accounts management — TikTok auto-scrape, Instagram manual info
import { useState, useEffect } from 'react';
import { Plus, Trash2, RefreshCw, Instagram, Music2, Youtube, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import {
  getAllWatchAccounts,
  addWatchAccount,
  deleteWatchAccount,
  scrapeTikTokAccount,
  type WatchAccount,
} from '../../services/savedContent';

const PLATFORM_OPTIONS = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
];

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'instagram') return <Instagram size={13} />;
  if (platform === 'tiktok') return <Music2 size={13} />;
  return <Youtube size={13} />;
}

function getPlatformBadgeColor(platform: string) {
  if (platform === 'instagram') return 'bg-jb-ig/20 text-jb-ig';
  if (platform === 'tiktok') return 'bg-jb-tt/20 text-jb-tt';
  return 'bg-jb-yt/20 text-jb-yt';
}

export default function AccountsTab({ onScraped }: { onScraped?: () => void }) {
  const [accounts, setAccounts] = useState<WatchAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [scraping, setScraping] = useState<string | null>(null);
  const [scrapeMsg, setScrapeMsg] = useState<Record<string, string>>({});
  const [igInfo, setIgInfo] = useState<string | null>(null);

  useEffect(() => {
    getAllWatchAccounts()
      .then(setAccounts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!username.trim()) return;
    setAdding(true);
    try {
      const account = await addWatchAccount({ username: username.replace('@', '').trim(), platform, notes });
      setAccounts((prev) => [account, ...prev]);
      setUsername('');
      setNotes('');
    } catch {} finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteWatchAccount(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleScrape(account: WatchAccount) {
    if (account.platform === 'instagram') {
      setIgInfo(account.username);
      return;
    }
    setScraping(account.id);
    setScrapeMsg((m) => ({ ...m, [account.id]: 'Starte...' }));
    try {
      const results = await scrapeTikTokAccount(account, (msg) => {
        setScrapeMsg((m) => ({ ...m, [account.id]: msg }));
      });
      setScrapeMsg((m) => ({ ...m, [account.id]: `${results.length} Videos von @${account.username} analysiert` }));
      setAccounts((prev) => prev.map((a) => a.id === account.id ? { ...a, last_scraped: new Date().toISOString() } : a));
      onScraped?.();
    } catch (e) {
      setScrapeMsg((m) => ({ ...m, [account.id]: e instanceof Error ? e.message : 'Fehler beim Scraping' }));
    } finally {
      setScraping(null);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="bg-jb-card border border-jb-border rounded-xl p-4 space-y-3">
        <h4 className="text-sm font-semibold text-jb-text">Account hinzufuegen</h4>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
          />
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 transition-colors"
          >
            {PLATFORM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notizen (optional, z.B. 'Lifestyle Creator, POV-Stil')"
          className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
        />
        <Button
          icon={<Plus size={14} />}
          onClick={handleAdd}
          loading={adding}
          disabled={!username.trim()}
          className="w-full"
        >
          Hinzufuegen
        </Button>
      </div>

      {igInfo && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
          <p className="text-sm text-jb-text leading-relaxed">
            Instagram erlaubt kein automatisches Scraping fremder Accounts.
            Oeffne das Profil, kopiere die Caption deines Lieblingsvideos und fuege sie in Tab "Link analysieren" ein.
          </p>
          <div className="flex gap-2">
            <a
              href={`https://www.instagram.com/${igInfo.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:underline"
            >
              <ExternalLink size={13} /> Profil oeffnen
            </a>
            <button onClick={() => setIgInfo(null)} className="text-xs text-jb-text-muted hover:text-jb-text ml-auto">
              Schliessen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="bg-jb-card border border-jb-border rounded-xl p-4 animate-pulse h-20" />)}
        </div>
      ) : accounts.length === 0 ? (
        <p className="text-sm text-jb-text-muted text-center py-8">Noch keine Accounts. Fuege deinen ersten hinzu.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <div key={account.id} className="bg-jb-card border border-jb-border rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-jb-bg border border-jb-border flex items-center justify-center flex-shrink-0">
                <PlatformIcon platform={account.platform} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-jb-text">@{account.username}</p>
                  <Badge color={getPlatformBadgeColor(account.platform)}>{account.platform}</Badge>
                </div>
                {account.notes && <p className="text-xs text-jb-text-secondary mt-0.5">{account.notes}</p>}
                <p className="text-[10px] text-jb-text-muted mt-1">
                  Letzter Scan: {account.last_scraped ? new Date(account.last_scraped).toLocaleDateString('de-DE') : 'noch nie'}
                </p>
                {scrapeMsg[account.id] && (
                  <p className="text-xs text-jb-accent mt-1">{scrapeMsg[account.id]}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw size={12} />}
                  onClick={() => handleScrape(account)}
                  loading={scraping === account.id}
                >
                  Analysieren
                </Button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-jb-border text-jb-text-muted hover:text-jb-danger hover:border-jb-danger/30 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
