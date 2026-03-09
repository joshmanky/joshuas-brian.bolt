// AnalyticsPage: cross-platform analytics with AI hook insight card
import { useState, useEffect, useRef } from 'react';
import { BarChart3, TrendingUp, Sparkles } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask } from '../services/claude';
import { formatNumber, average, detectHookType } from '../lib/utils';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [igFollowers, setIgFollowers] = useState(0);
  const [ttFollowers, setTtFollowers] = useState(0);
  const [ytSubs, setYtSubs] = useState(0);
  const [igAvgLikes, setIgAvgLikes] = useState(0);
  const [ttAvgLikes, setTtAvgLikes] = useState(0);
  const [ytAvgLikes, setYtAvgLikes] = useState(0);
  const [hookPerformance, setHookPerformance] = useState<{ name: string; value: number }[]>([]);
  const [weeklyPosts, setWeeklyPosts] = useState<{ name: string; value: number }[]>([]);
  const [contentTypeData, setContentTypeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [hookInsight, setHookInsight] = useState('');
  const [hookInsightLoading, setHookInsightLoading] = useState(false);
  const hookInsightTriggered = useRef(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const [igData, ttData, ytData, igPosts, ttVideos, ytVideos] = await Promise.all([
        supabase.from('instagram_data').select('followers_count').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tiktok_data').select('followers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('youtube_data').select('subscribers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('instagram_posts').select('like_count, caption, media_type, timestamp').order('timestamp', { ascending: false }),
        supabase.from('tiktok_videos').select('likes, created_at').order('created_at', { ascending: false }),
        supabase.from('youtube_videos').select('likes, published_at').order('published_at', { ascending: false }),
      ]);

      setIgFollowers(igData.data?.followers_count || 0);
      setTtFollowers(ttData.data?.followers || 0);
      setYtSubs(ytData.data?.subscribers || 0);

      const igPostsData = igPosts.data || [];
      const ttVideosData = ttVideos.data || [];
      const ytVideosData = ytVideos.data || [];

      setIgAvgLikes(average(igPostsData.slice(0, 10).map((p) => p.like_count)));
      setTtAvgLikes(average(ttVideosData.slice(0, 10).map((v) => v.likes)));
      setYtAvgLikes(average(ytVideosData.slice(0, 10).map((v) => v.likes)));

      const hookMap: Record<string, number[]> = {};
      igPostsData.forEach((p) => {
        const hook = detectHookType(p.caption || '');
        if (hook) {
          if (!hookMap[hook]) hookMap[hook] = [];
          hookMap[hook].push(p.like_count);
        }
      });
      const hookLabels: Record<string, string> = {
        frage_hook: 'Frage',
        identitaets_hook: 'Identitaet',
        zahlen_hook: 'Zahlen',
        kontrast_hook: 'Kontrast',
        statement_hook: 'Statement',
      };
      setHookPerformance(
        Object.entries(hookMap).map(([key, likes]) => ({
          name: hookLabels[key] || key,
          value: average(likes),
        }))
      );

      const typeCount: Record<string, number> = {};
      igPostsData.forEach((p) => {
        const type = p.media_type || 'IMAGE';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      const typeColors: Record<string, string> = { VIDEO: '#b8f94a', IMAGE: '#f59e0b', CAROUSEL_ALBUM: '#3b82f6' };
      const typeLabels: Record<string, string> = { VIDEO: 'Reel', IMAGE: 'Foto', CAROUSEL_ALBUM: 'Carousel' };
      setContentTypeData(
        Object.entries(typeCount).map(([type, count]) => ({
          name: typeLabels[type] || type,
          value: count,
          color: typeColors[type] || '#8a8a8e',
        }))
      );

      const allTimestamps = [
        ...igPostsData.map((p) => p.timestamp),
        ...ttVideosData.map((v) => v.created_at),
        ...ytVideosData.map((v) => v.published_at),
      ].filter(Boolean);

      const weeks: Record<string, number> = {};
      const now = new Date();
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - i * 7 * 86400000);
        const key = `KW ${getWeekNumber(weekStart)}`;
        weeks[key] = 0;
      }
      allTimestamps.forEach((ts) => {
        const d = new Date(ts);
        const key = `KW ${getWeekNumber(d)}`;
        if (key in weeks) weeks[key]++;
      });
      setWeeklyPosts(Object.entries(weeks).map(([name, value]) => ({ name, value })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && hookPerformance.length > 0 && !hookInsightTriggered.current) {
      hookInsightTriggered.current = true;
      loadHookInsight();
    }
  }, [loading, hookPerformance]);

  async function loadHookInsight() {
    setHookInsightLoading(true);
    try {
      const hookSummary = hookPerformance
        .map((h) => `${h.name}: durchschnittlich ${h.value} Likes`)
        .join(', ');
      const result = await callClaude(
        'Du bist ein Analytics Agent. Analysiere die Hook-Typ Performance-Daten und gib EINEN Satz als Empfehlung. Format: "Dein bester Hook-Typ ist X mit durchschnittlich Y Likes. Erstelle mehr davon." Deutsch. Nur ein Satz.',
        `Hook-Typ Performance: ${hookSummary}`
      );
      await logAiTask('Analytics Agent', 'hook_insight', result);
      setHookInsight(result);
    } catch {
      setHookInsight('');
    } finally {
      setHookInsightLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer h-40 rounded-xl" />)}
      </div>
    );
  }

  const platformCompare = [
    { name: 'Instagram', value: igFollowers, color: '#E1306C' },
    { name: 'TikTok', value: ttFollowers, color: '#00f2ea' },
    { name: 'YouTube', value: ytSubs, color: '#FF0000' },
  ];

  const likesCompare = [
    { name: 'Instagram', value: igAvgLikes, color: '#E1306C' },
    { name: 'TikTok', value: ttAvgLikes, color: '#00f2ea' },
    { name: 'YouTube', value: ytAvgLikes, color: '#FF0000' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <BarChart3 size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Performance Analytics</h1>
          <p className="text-sm text-jb-text-secondary">Cross-Platform Vergleich</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="IG Followers" value={formatNumber(igFollowers)} />
        <StatCard label="TT Followers" value={formatNumber(ttFollowers)} />
        <StatCard label="YT Subs" value={formatNumber(ytSubs)} />
        <StatCard label="IG Avg Likes" value={formatNumber(igAvgLikes)} />
        <StatCard label="TT Avg Likes" value={formatNumber(ttAvgLikes)} />
        <StatCard label="YT Avg Likes" value={formatNumber(ytAvgLikes)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4 flex items-center gap-2">
            <TrendingUp size={15} className="text-jb-accent" /> Follower Vergleich
          </h3>
          <SimpleBarChart data={platformCompare} height={200} />
        </div>

        <div className="bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4 flex items-center gap-2">
            <BarChart3 size={15} className="text-jb-accent" /> Avg Likes Vergleich
          </h3>
          <SimpleBarChart data={likesCompare} height={200} />
        </div>

        {hookPerformance.length > 0 && (
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-jb-text mb-4">Hook-Typ Performance (Avg Likes)</h3>
            <SimpleBarChart data={hookPerformance} height={200} />
          </div>
        )}

        {contentTypeData.length > 0 && (
          <div className="bg-jb-card border border-jb-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-jb-text mb-4">Content-Typ Verteilung (Instagram)</h3>
            <SimpleBarChart data={contentTypeData} height={200} />
          </div>
        )}
      </div>

      {(hookInsight || hookInsightLoading) && (
        <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 accent-glow">
          <h3 className="text-sm font-semibold text-jb-accent mb-3 flex items-center gap-2">
            <Sparkles size={14} /> Best Hook Insight
          </h3>
          {hookInsightLoading ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-3 h-3 border-2 border-jb-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-jb-text-muted">Analysiere Hook-Performance...</span>
            </div>
          ) : (
            <p className="text-sm text-jb-text leading-relaxed">{hookInsight}</p>
          )}
        </div>
      )}

      {weeklyPosts.length > 0 && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4">Posting-Frequenz (Posts/Woche)</h3>
          <SimpleLineChart data={weeklyPosts} height={220} />
        </div>
      )}
    </div>
  );
}

function getWeekNumber(d: Date): number {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}
