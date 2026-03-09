// SettingsPage: API key management for all platforms
import { useState, useEffect } from 'react';
import { Key, Instagram, Music2, Youtube, Brain, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import { getAllApiKeys, saveApiKey } from '../services/apiKeys';
import { maskApiKey } from '../lib/utils';

interface KeyField {
  platform: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  helpText: string;
}

const KEY_FIELDS: KeyField[] = [
  {
    platform: 'instagram',
    label: 'Instagram Access Token',
    icon: <Instagram size={18} className="text-jb-ig" />,
    placeholder: 'IGQVJx...',
    helpText: 'Facebook Graph API Long-Lived Token',
  },
  {
    platform: 'tiktok',
    label: 'Apify API Token',
    icon: <Music2 size={18} className="text-jb-tt" />,
    placeholder: 'apify_api_...',
    helpText: 'Apify.com API Token fuer TikTok Scraper',
  },
  {
    platform: 'youtube',
    label: 'YouTube Data API Key',
    icon: <Youtube size={18} className="text-jb-yt" />,
    placeholder: 'AIzaSy...',
    helpText: 'Google Cloud Console API Key',
  },
  {
    platform: 'claude',
    label: 'Claude API Key',
    icon: <Brain size={18} className="text-jb-accent" />,
    placeholder: 'sk-ant-...',
    helpText: 'Anthropic API Key fuer AI Features',
  },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllApiKeys().then((data) => {
      setKeys(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async (platform: string) => {
    const val = inputs[platform];
    if (!val?.trim()) return;
    setSaving((p) => ({ ...p, [platform]: true }));
    const ok = await saveApiKey(platform, val.trim());
    if (ok) {
      setKeys((p) => ({ ...p, [platform]: val.trim() }));
      setInputs((p) => ({ ...p, [platform]: '' }));
      setSaved((p) => ({ ...p, [platform]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [platform]: false })), 2000);
    }
    setSaving((p) => ({ ...p, [platform]: false }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Key size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Settings</h1>
          <p className="text-sm text-jb-text-secondary">API Keys und Zugangsdaten verwalten</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="shimmer h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {KEY_FIELDS.map((field) => {
            const hasKey = !!keys[field.platform];
            return (
              <div
                key={field.platform}
                className="bg-jb-card border border-jb-border rounded-xl p-5 transition-colors hover:border-jb-border-light"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    {field.icon}
                    <span className="text-sm font-semibold text-jb-text">{field.label}</span>
                  </div>
                  {hasKey && (
                    <div className="flex items-center gap-1.5 text-xs text-jb-success">
                      <Check size={12} />
                      Verbunden
                    </div>
                  )}
                  {!hasKey && (
                    <div className="flex items-center gap-1.5 text-xs text-jb-text-muted">
                      <AlertCircle size={12} />
                      Nicht konfiguriert
                    </div>
                  )}
                </div>

                {hasKey && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-jb-bg rounded-lg">
                    <span className="stat-number text-xs text-jb-text-secondary flex-1">
                      {showKey[field.platform] ? keys[field.platform] : maskApiKey(keys[field.platform])}
                    </span>
                    <button
                      onClick={() => setShowKey((p) => ({ ...p, [field.platform]: !p[field.platform] }))}
                      className="text-jb-text-muted hover:text-jb-text transition-colors"
                    >
                      {showKey[field.platform] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={inputs[field.platform] || ''}
                    onChange={(e) => setInputs((p) => ({ ...p, [field.platform]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-jb-bg border border-jb-border rounded-lg px-3 py-2 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 transition-colors"
                  />
                  <Button
                    size="sm"
                    loading={saving[field.platform]}
                    onClick={() => handleSave(field.platform)}
                    disabled={!inputs[field.platform]?.trim()}
                  >
                    {saved[field.platform] ? 'Gespeichert!' : hasKey ? 'Update' : 'Speichern'}
                  </Button>
                </div>
                <p className="text-[11px] text-jb-text-muted mt-2">{field.helpText}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
