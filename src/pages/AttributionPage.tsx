// AttributionPage: manual conversion tracking with stats, charts, and list
import { useState, useEffect, useMemo } from 'react';
import { Target, Plus, Trash2 } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import StatCard from '../components/ui/StatCard';
import Badge from '../components/ui/Badge';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAllAttributions, createAttribution, deleteAttribution } from '../services/attribution';
import { formatDate, formatNumber } from '../lib/utils';
import type { Attribution } from '../types';

const CHANNEL_OPTIONS = [
  { value: 'Instagram DM', label: 'Instagram DM' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Email', label: 'Email' },
];

const CHANNEL_COLORS: Record<string, string> = {
  'Instagram DM': '#E1306C',
  TikTok: '#00f2ea',
  YouTube: '#FF0000',
  Telegram: '#0088cc',
  WhatsApp: '#25D366',
  Email: '#b8f94a',
};

const CHANNEL_BADGE: Record<string, string> = {
  'Instagram DM': 'bg-jb-ig/15 text-jb-ig',
  TikTok: 'bg-jb-tt/15 text-jb-tt',
  YouTube: 'bg-jb-yt/15 text-jb-yt',
  Telegram: 'bg-blue-500/15 text-blue-400',
  WhatsApp: 'bg-emerald-500/15 text-emerald-400',
  Email: 'bg-jb-accent/10 text-jb-accent',
};

export default function AttributionPage() {
  const [items, setItems] = useState<Attribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lead_name: '',
    channel: 'Instagram DM',
    content_title: '',
    revenue: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await getAllAttributions();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const totalRevenue = items.reduce((sum, i) => sum + Number(i.revenue), 0);
    const channelCount: Record<string, number> = {};
    const channelRevenue: Record<string, number> = {};
    items.forEach((i) => {
      channelCount[i.channel] = (channelCount[i.channel] || 0) + 1;
      channelRevenue[i.channel] = (channelRevenue[i.channel] || 0) + Number(i.revenue);
    });
    const bestChannel = Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
    const avgRevenue = items.length > 0 ? Math.round(totalRevenue / items.length) : 0;

    const conversionsByChannel = Object.entries(channelCount).map(([name, value]) => ({
      name,
      value,
      color: CHANNEL_COLORS[name] || '#b8f94a',
    }));

    const revenueByChannel = Object.entries(channelRevenue).map(([name, value]) => ({
      name,
      value,
      color: CHANNEL_COLORS[name] || '#b8f94a',
    }));

    return { totalRevenue, bestChannel, avgRevenue, conversionsByChannel, revenueByChannel };
  }, [items]);

  async function handleCreate() {
    if (!form.lead_name.trim()) return;
    setSaving(true);
    try {
      const item = await createAttribution({
        lead_name: form.lead_name.trim(),
        channel: form.channel,
        content_title: form.content_title.trim(),
        revenue: parseFloat(form.revenue) || 0,
        date: form.date,
        notes: form.notes.trim(),
      });
      if (item) setItems((prev) => [item, ...prev]);
      setShowModal(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setForm({
      lead_name: '',
      channel: 'Instagram DM',
      content_title: '',
      revenue: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  }

  async function handleDelete(id: string) {
    await deleteAttribution(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
            <Target size={20} className="text-jb-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-jb-text">Attribution</h1>
            <p className="text-sm text-jb-text-secondary">Content-zu-Revenue Tracking</p>
          </div>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
          Conversion eintragen
        </Button>
      </div>

      <p className="text-sm text-jb-text-secondary leading-relaxed">
        Welche Inhalte bringen Leads und Sales? Trage hier manuell Conversions ein und verknuepfe sie mit Content.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Conversions" value={items.length} />
        <StatCard label="Total Revenue" value={`${formatNumber(stats.totalRevenue)} EUR`} accent />
        <StatCard label="Best Channel" value={stats.bestChannel} />
        <StatCard label="Avg Revenue/Lead" value={`${formatNumber(stats.avgRevenue)} EUR`} />
      </div>

      {(stats.conversionsByChannel.length > 0 || stats.revenueByChannel.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {stats.conversionsByChannel.length > 0 && (
            <div className="bg-jb-card border border-jb-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-jb-text mb-4">Conversions nach Kanal</h3>
              <SimpleBarChart data={stats.conversionsByChannel} height={200} />
            </div>
          )}
          {stats.revenueByChannel.length > 0 && (
            <div className="bg-jb-card border border-jb-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-jb-text mb-4">Revenue nach Kanal (EUR)</h3>
              <SimpleBarChart data={stats.revenueByChannel} height={200} />
            </div>
          )}
        </div>
      )}

      <div className="bg-jb-card border border-jb-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-jb-border">
          <h3 className="text-sm font-semibold text-jb-text">Alle Conversions ({items.length})</h3>
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-jb-text-muted">
            Noch keine Conversions eingetragen.
          </div>
        ) : (
          <div className="divide-y divide-jb-border">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 px-5 py-3 hover:bg-jb-card-hover transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-jb-text">{item.lead_name}</span>
                    <Badge color={CHANNEL_BADGE[item.channel] || CHANNEL_BADGE.Email}>{item.channel}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-jb-text-secondary">
                    {item.content_title && <span>{item.content_title}</span>}
                    {item.notes && <span className="truncate max-w-[200px]">{item.notes}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm font-semibold text-jb-success font-mono">
                    {Number(item.revenue).toLocaleString('de-DE')} EUR
                  </span>
                  <span className="text-[10px] text-jb-text-muted">{formatDate(item.date)}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-jb-text-muted hover:text-jb-danger hover:bg-jb-danger/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title="Conversion eintragen"
      >
        <div className="space-y-4">
          <Input
            label="Lead Name"
            value={form.lead_name}
            onChange={(e) => setForm((f) => ({ ...f, lead_name: e.target.value }))}
            placeholder="z.B. Max Mustermann"
          />
          <Select
            label="Kanal"
            options={CHANNEL_OPTIONS}
            value={form.channel}
            onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}
          />
          <Input
            label="Content-Titel (optional)"
            value={form.content_title}
            onChange={(e) => setForm((f) => ({ ...f, content_title: e.target.value }))}
            placeholder="Welches Video/Post hat den Lead generiert?"
          />
          <Input
            label="Revenue (EUR)"
            type="number"
            value={form.revenue}
            onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))}
            placeholder="0"
          />
          <Input
            label="Datum"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
          <div>
            <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">
              Notizen
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              placeholder="Zusaetzliche Infos..."
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Abbrechen</Button>
            <Button
              variant="primary"
              onClick={handleCreate}
              loading={saving}
              disabled={!form.lead_name.trim()}
            >
              Speichern
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
