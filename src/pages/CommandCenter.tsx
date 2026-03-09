// CommandCenter: data-driven dashboard with real AI insight using actual post data
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, FileText, Heart, Trophy, Zap, Sparkles, BarChart3, Plus,
  Instagram, Music2, Youtube, ArrowRight,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from '../services/claude';
import { fetchTopPerformanceData, buildPerformanceContext } from '../services/performanceData';
import { formatNumber, formatTimeAgo, getPlatformTextColor } from '../lib/utils';

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
  const [avgLikes, setAvgLikes] = useState(0);
  const [bestPlatform, setBestPlatform] = useState('—');
  const [aiTaskCount, setAiTaskCount] = useState(0);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [igData, ttData, ytData, igPosts, ttVideos, ytVideos, aiTasks] = await Promise.all([
        supabase.from('instagram_data').select('followers_count').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tiktok_data').select('followers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('youtube_data').select('subscribers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('instagram_posts').select('ig_id, caption, like_count, thumbnail_url, timestamp').order('timestamp', { ascending: false }).limit(10),
        supabase.from('tiktok_videos').select('video_id, description, likes, views, thumbnail_url, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('youtube_videos').select('yt_id, title, likes, views, thumbnail_url, published_at').order('published_at', { ascending: false }).limit(10),
        supabase.from('ai_tasks_log').select('id', { count: 'exact', head: true }),
      ]);

      const igFollowers = igData.data?.followers_count || 0;
      const ttFollowers = ttData.data?.followers || 0;
      const ytSubs = ytData.data?.subscribers || 0;
      setTotalFollowers(igFollowers + ttFollowers + ytSubs);

      const allPosts: FeedItem[] = [];
      (igPosts.data || []).forEach((p) => allPosts.push({ id: p.ig_id, platform: 'instagram', text: p.caption || '', likes: p.like_count, timestamp: p.timestamp, thumbnail: p.thumbnail_url }));
      (ttVideos.data || []).forEach((v) => allPosts.push({ id: v.video_id, platform: 'tiktok', text: v.description || '', likes: v.likes, timestamp: v.created_at, thumbnail: v.thumbnail_url }));
      (ytVideos.data || []).forEach((v) => allPosts.push({ id: v.yt_id, platform: 'youtube', text: v.title || '', likes: v.likes, timestamp: v.published_at, thumbnail: v.thumbnail_url }));

      allPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setFeed(allPosts.slice(0, 5));

      const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      setPostsThisWeek(allPosts.filter((p) => p.timestamp > oneWeekAgo).length);

      const allLikes = allPosts.slice(0, 10).map((p) => p.likes);
      setAvgLikes(allLikes.length ? Math.round(allLikes.reduce((a, b) => a + b, 0) / allLikes.length) : 0);

      const platformLikes: Record<string, number[]> = { instagram: [], tiktok: [], youtube: [] };
      allPosts.forEach((p) => platformLikes[p.platform]?.push(p.likes));
      let best = '—';
      let bestAvg = 0;
      Object.entries(platformLikes).forEach(([plat, likes]) => {
        if (likes.length > 0) {
          const avg = likes.reduce((a, b) => a + b, 0) / likes.length;
          if (avg > bestAvg) { bestAvg = avg; best = plat.charAt(0).toUpperCase() + plat.slice(1); }
        }
      });
      setBestPlatform(best);
      setAiTaskCount(aiTasks.count || 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  const insightTriggered = useRef(false);

  const loadInsight = async () => {
    setInsightLoading(true);
    try {
      const perfData = await fetchTopPerformanceData();
      const perfContext = buildPerformanceContext(perfData);

      const summary = [
        `Followers gesamt: ${totalFollowers}. Posts diese Woche: ${postsThisWeek}. Avg Likes: ${avgLikes}. Beste Plattform: ${bestPlatform}.`,
        perfContext ? `\n--- TOP CONTENT DATEN ---\n${perfContext}\n--- ENDE ---` : '',
      ].join('');

      const result = await callClaude(
        'Du bist Joshua Tischers persoenlicher Performance-Analyst. Analysiere seine Plattform-Daten und gib einen konkreten, datenbasierten Handlungstipp. Nenne konkrete Zahlen. Max 3 Saetze. Deutsch. Kein Motivations-Bullshit.',
        summary
      );
      await logAiTask('Dashboard Insight Agent', 'dashboard_insight', result);
      setInsight(result);
    } catch {
      setInsight('AI Insight konnte nicht geladen werden. Bitte Claude API Key in Settings hinterlegen.');
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && totalFollowers > 0 && !insightTriggered.current) {
      insightTriggered.current = true;
      loadInsight();
    }
  }, [loading]);

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total Followers" value={formatNumber(totalFollowers)} icon={<Users size={15} />} accent />
        <StatCard label="Posts / Woche" value={postsThisWeek} icon={<FileText size={15} />} />
        <StatCard label="Avg Likes" value={formatNumber(avgLikes)} icon={<Heart size={15} />} subtitle="Letzte 10" />
        <StatCard label="Beste Plattform" value={bestPlatform} icon={<Trophy size={15} />} />
        <StatCard label="AI Tasks" value={aiTaskCount} icon={<Sparkles size={15} />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4">Live Feed</h3>
          {feed.length === 0 ? (
            <p className="text-xs text-jb-text-muted py-6 text-center">Noch keine Daten. Verbinde deine Plattformen unter Settings.</p>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-jb-bg rounded-lg hover:bg-jb-card-hover transition-colors">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-jb-border flex items-center justify-center flex-shrink-0">
                      {getPlatformIcon(item.platform)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-jb-text truncate">{item.text || '—'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`${getPlatformTextColor(item.platform)}`}>
                        {getPlatformIcon(item.platform)}
                      </span>
                      <span className="stat-number text-[11px] text-jb-text-muted">{formatNumber(item.likes)} Likes</span>
                      <span className="text-[11px] text-jb-text-muted">{formatTimeAgo(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-jb-text mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="secondary" size="sm" className="w-full justify-start" icon={<Sparkles size={14} />} onClick={() => navigate('/script-generator')}>
                Script generieren <ArrowRight size={12} className="ml-auto" />
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" icon={<BarChart3 size={14} />} onClick={() => navigate('/analytics')}>
                Performance analysieren <ArrowRight size={12} className="ml-auto" />
              </Button>
              <Button variant="secondary" size="sm" className="w-full justify-start" icon={<Plus size={14} />} onClick={() => navigate('/pipeline')}>
                Idee hinzufuegen <ArrowRight size={12} className="ml-auto" />
              </Button>
            </div>
          </div>

          <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 accent-glow">
            <h3 className="text-sm font-semibold text-jb-accent mb-3 flex items-center gap-2">
              <Sparkles size={14} /> AI Insight
            </h3>
            {insightLoading ? (
              <div className="flex items-center gap-2 py-2">
                <div className="w-3 h-3 border-2 border-jb-accent border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-jb-text-muted">Analysiere...</span>
              </div>
            ) : (
              <p className="text-sm text-jb-text leading-relaxed">
                {insight || 'Verbinde deine Plattformen fuer AI-gestuetzte Insights.'}
              </p>
            )}
            {!insightLoading && totalFollowers > 0 && (
              <Badge className="mt-3 cursor-pointer" color="bg-jb-accent/10 text-jb-accent">
                <button onClick={loadInsight} className="text-[10px]">Neuer Tipp</button>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
