// CommandCenter: CEO Insight + Heute-Cockpit + Performance + Live Feed + Attribution + Quick Actions
// Updated: replaced inline performance section with WeeklyPerformanceSection component
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Sparkles, Zap, Brain, Lightbulb, BarChart3,
  Instagram, Music2, Youtube, RefreshCw, Send, Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp, Heart,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Select from '../components/ui/Select';
import WeeklyPerformanceSection from '../components/command/WeeklyPerformanceSection';
import { supabase } from '../lib/supabase';
import { runCeoAnalysis, loadCachedCeoAnalysis, type CeoAnalysis } from '../services/ceoAgent';
import { createAttribution } from '../services/attribution';
import { getScheduledForToday, getPublishedToday, getTopPerformingCards } from '../services/pipeline';
import { formatNumber, formatTimeAgo, getPlatformTextColor, getPlatformColor } from '../lib/utils';
import type { PipelineCard } from '../types';

const CHANNEL_OPTIONS = [
  { value: '', label: 'Kanal waehlen...' },
  { value: 'Instagram DM', label: 'Instagram DM' },
  { value: 'TikTok', label: 'TikTok' },
  { value: 'YouTube', label: 'YouTube' },
  { value: 'Telegram', label: 'Telegram' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Email', label: 'Email' },
];

interface FeedItem {
  id: string;
  platform: string;
  text: string;
  likes: number;
  timestamp: string;
  thumbnail?: string;
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [postsThisWeek, setPostsThisWeek] = useState(0);
  const [aiTaskCount, setAiTaskCount] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ceoAnalysis, setCeoAnalysis] = useState<CeoAnalysis | null>(null);
  const [ceoLoading, setCeoLoading] = useState(false);
  const [ceoError, setCeoError] = useState<string | null>(null);
  const [attrForm, setAttrForm] = useState({ lead_name: '', channel: '', content_title: '', revenue: '' });
  const [attrSaving, setAttrSaving] = useState(false);
  const [attrSuccess, setAttrSuccess] = useState(false);
  const [scheduledToday, setScheduledToday] = useState<PipelineCard[]>([]);
  const [publishedCount, setPublishedCount] = useState(0);
  const [topCards, setTopCards] = useState<PipelineCard[]>([]);

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [igData, ttData, ytData, igPosts, ttVideos, ytVideos, aiTasks, scheduled, published, cachedCeo, topPerf] = await Promise.all([
        supabase.from('instagram_data').select('followers_count').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tiktok_data').select('followers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('youtube_data').select('subscribers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('instagram_posts').select('ig_id, caption, like_count, thumbnail_url, timestamp').order('timestamp', { ascending: false }).limit(10),
        supabase.from('tiktok_videos').select('video_id, description, likes, views, thumbnail_url, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('youtube_videos').select('yt_id, title, likes, views, thumbnail_url, published_at').order('published_at', { ascending: false }).limit(10),
        supabase.from('ai_tasks_log').select('id', { count: 'exact', head: true }),
        getScheduledForToday(),
        getPublishedToday(),
        loadCachedCeoAnalysis(),
        getTopPerformingCards(3),
      ]);

      setTotalFollowers((igData.data?.followers_count || 0) + (ttData.data?.followers || 0) + (ytData.data?.subscribers || 0));
      setScheduledToday(scheduled);
      setPublishedCount(published);
      setTopCards(topPerf);
      if (cachedCeo) setCeoAnalysis(cachedCeo);

      const allPosts: FeedItem[] = [];
      (igPosts.data || []).forEach((p) => allPosts.push({ id: p.ig_id, platform: 'instagram', text: p.caption || '', likes: p.like_count, timestamp: p.timestamp, thumbnail: p.thumbnail_url }));
      (ttVideos.data || []).forEach((v) => allPosts.push({ id: v.video_id, platform: 'tiktok', text: v.description || '', likes: v.likes, timestamp: v.created_at, thumbnail: v.thumbnail_url }));
      (ytVideos.data || []).forEach((v) => allPosts.push({ id: v.yt_id, platform: 'youtube', text: v.title || '', likes: v.likes, timestamp: v.published_at, thumbnail: v.thumbnail_url }));
      allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setFeed(allPosts.slice(0, 8));

      const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      setPostsThisWeek(allPosts.filter((p) => p.timestamp > oneWeekAgo).length);
      setAiTaskCount(aiTasks.count || 0);
    } catch {} finally { setLoading(false); }
  }

  async function loadCeoInsight() {
    setCeoLoading(true);
    setCeoError(null);
    try {
      const result = await runCeoAnalysis();
      setCeoAnalysis(result);
    } catch (e) {
      setCeoError(e instanceof Error ? e.message : 'CEO Analyse fehlgeschlagen');
    } finally { setCeoLoading(false); }
  }

  async function handleAttrSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!attrForm.lead_name || !attrForm.channel) return;
    setAttrSaving(true);
    try {
      await createAttribution({
        lead_name: attrForm.lead_name,
        channel: attrForm.channel,
        content_title: attrForm.content_title,
        revenue: parseFloat(attrForm.revenue) || 0,
        date: new Date().toISOString().split('T')[0],
      });
      setAttrForm({ lead_name: '', channel: '', content_title: '', revenue: '' });
      setAttrSuccess(true);
      setTimeout(() => setAttrSuccess(false), 2000);
    } catch {} finally { setAttrSaving(false); }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram size={14} />;
      case 'tiktok': return <Music2 size={14} />;
      case 'youtube': return <Youtube size={14} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
        </div>
        <div className="shimmer h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent flex items-center justify-center">
          <Zap size={20} className="text-jb-bg" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Command Center</h1>
          <p className="text-sm text-jb-text-secondary">Dein Social Media Cockpit</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Followers" value={formatNumber(totalFollowers)} icon={<Users size={15} />} accent />
        <StatCard label="Posts diese Woche" value={postsThisWeek} icon={<FileText size={15} />} />
        <StatCard label="AI Tasks" value={aiTaskCount} icon={<Sparkles size={15} />} />
        <StatCard label="CEO Status" value={ceoLoading ? '...' : ceoAnalysis ? 'Aktiv' : 'Offline'} icon={<Brain size={15} />} subtitle={ceoAnalysis ? formatTimeAgo(ceoAnalysis.generatedAt) : undefined} />
      </div>

      <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-jb-text flex items-center gap-2">
            <Calendar size={14} className="text-jb-accent" /> Heute
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-jb-warning" />
              <span className="text-xs text-jb-text-secondary">{scheduledToday.length} geplant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-jb-success" />
              <span className="text-xs text-jb-text-secondary">{publishedCount} veroeffentlicht</span>
            </div>
          </div>
        </div>

        {scheduledToday.length === 0 && publishedCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-jb-text-muted mb-3">Keine Posts fuer heute geplant.</p>
            <Button
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={() => navigate('/studio')}
            >
              Post fuer heute erstellen
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {scheduledToday.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-3 p-2.5 bg-jb-bg rounded-lg hover:bg-jb-card-hover transition-colors cursor-pointer"
                onClick={() => navigate('/pipeline')}
              >
                <div className={`w-2 h-2 rounded-full ${getPlatformColor(card.platform)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-jb-text truncate">{card.title}</p>
                </div>
                <Badge color="bg-jb-warning/10 text-jb-warning">Scheduled</Badge>
              </div>
            ))}
            {scheduledToday.length === 0 && publishedCount > 0 && (
              <p className="text-sm text-jb-success text-center py-2">
                {publishedCount} Post{publishedCount > 1 ? 's' : ''} heute veroeffentlicht!
              </p>
            )}
            <div className="pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<Sparkles size={14} />}
                onClick={() => navigate('/studio')}
                className="w-full"
              >
                Neuen Post erstellen
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-jb-text mb-4">Live Feed</h3>
            {feed.length === 0 ? (
              <p className="text-xs text-jb-text-muted py-6 text-center">Noch keine Daten. Verbinde deine Plattformen unter Settings.</p>
            ) : (
              <div className="space-y-2">
                {feed.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2.5 bg-jb-bg rounded-lg hover:bg-jb-card-hover transition-colors">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-jb-border flex items-center justify-center flex-shrink-0">
                        {getPlatformIcon(item.platform)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-jb-text truncate">{item.text || '\u2014'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={getPlatformTextColor(item.platform)}>{getPlatformIcon(item.platform)}</span>
                        <span className="stat-number text-[11px] text-jb-text-muted">{formatNumber(item.likes)} Likes</span>
                        <span className="text-[11px] text-jb-text-muted">{formatTimeAgo(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <WeeklyPerformanceSection />

          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-jb-text">Attribution Schnelleingabe</h3>
              {attrSuccess && <Badge color="bg-jb-success/10 text-jb-success">Gespeichert</Badge>}
            </div>
            <form onSubmit={handleAttrSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <input
                type="text"
                placeholder="Lead Name"
                value={attrForm.lead_name}
                onChange={(e) => setAttrForm({ ...attrForm, lead_name: e.target.value })}
                className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
                required
              />
              <Select options={CHANNEL_OPTIONS} value={attrForm.channel} onChange={(e) => setAttrForm({ ...attrForm, channel: e.target.value })} required />
              <input
                type="text"
                placeholder="Content"
                value={attrForm.content_title}
                onChange={(e) => setAttrForm({ ...attrForm, content_title: e.target.value })}
                className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
              />
              <input
                type="number"
                placeholder="Revenue"
                value={attrForm.revenue}
                onChange={(e) => setAttrForm({ ...attrForm, revenue: e.target.value })}
                className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
                min="0"
                step="0.01"
              />
              <Button type="submit" size="md" loading={attrSaving} icon={<Send size={14} />}>Speichern</Button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 accent-glow">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-jb-accent flex items-center gap-2">
                <Brain size={14} /> CEO Insight
              </h3>
              <button onClick={loadCeoInsight} disabled={ceoLoading} className="text-jb-text-muted hover:text-jb-accent transition-colors disabled:opacity-50">
                <RefreshCw size={14} className={ceoLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            {ceoLoading ? (
              <div className="flex items-center gap-2 py-6 justify-center">
                <div className="w-4 h-4 border-2 border-jb-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-jb-text-muted">CEO analysiert...</span>
              </div>
            ) : ceoAnalysis ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-jb-text-secondary">Performance</span>
                  <p className="text-sm text-jb-text leading-relaxed mt-1">{ceoAnalysis.performanceSummary}</p>
                </div>
                {ceoAnalysis.contentPriorities.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-jb-text-secondary">Top Prioritaet</span>
                    <p className="text-sm text-jb-text mt-1">{ceoAnalysis.contentPriorities[0]}</p>
                  </div>
                )}
                {ceoAnalysis.agentOptimizations.length > 0 && (
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-jb-text-secondary">Agent Update</span>
                    <p className="text-xs text-jb-text-muted mt-1">
                      <span className="text-jb-accent font-medium">{ceoAnalysis.agentOptimizations[0].agentName}</span>: {ceoAnalysis.agentOptimizations[0].reason}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center space-y-2">
                <p className="text-sm text-jb-text-muted">CEO Analyse nicht verfuegbar.</p>
                <p className="text-xs text-jb-text-muted">Klicke auf den Refresh-Button um eine neue Analyse zu starten.</p>
              </div>
            )}
            {ceoError && (
              <div className="flex items-start gap-2 mt-3 p-2.5 bg-red-500/5 border border-red-500/20 rounded-lg">
                <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-400">{ceoError}</p>
              </div>
            )}
          </div>

          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-jb-text mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" size="md" className="w-full justify-start" icon={<Sparkles size={16} />} onClick={() => navigate('/studio')}>
                Skript
              </Button>
              <Button variant="secondary" size="md" className="w-full justify-start" icon={<Lightbulb size={16} />} onClick={() => navigate('/studio')}>
                Idee
              </Button>
              <Button variant="secondary" size="md" className="w-full justify-start" icon={<BarChart3 size={16} />} onClick={() => navigate('/platforms')}>
                Plattformen
              </Button>
              <Button variant="secondary" size="md" className="w-full justify-start" icon={<Brain size={16} />} onClick={() => navigate('/brain?tab=transkript')}>
                Brain fuettern
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
