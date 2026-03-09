// CrossPlatformAnalyticsPage: combined stats, side-by-side comparison, best formats, AI insight
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Sparkles, Award, Users, FileText } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { supabase } from '../lib/supabase';
import { callClaude } from '../services/claude';
import { formatNumber, average } from '../lib/utils';

interface PlatformStats {
  igFollowers: number;
  ttFollowers: number;
  ytSubs: number;
  igAvgLikes: number;
  ttAvgLikes: number;
  ytAvgLikes: number;
  igAvgComments: number;
  ttAvgComments: number;
  ytAvgComments: number;
  igPostCount: number;
  ttPostCount: number;
  ytPostCount: number;
  weeklyPosts: number;
  bestPlatform: string;
  igBestFormat: string;
  ttBestFormat: string;
  ytBestFormat: string;
}

const FORMAT_LABELS: Record<string, string> = {
  VIDEO: 'Reel',
  IMAGE: 'Foto',
  CAROUSEL_ALBUM: 'Carousel',
};

function detectBestFormat(
  posts: { media_type?: string; like_count?: number; likes?: number }[],
  likeKey: 'like_count' | 'likes'
): string {
  const formatMap: Record<string, number[]> = {};
  posts.forEach((p) => {
    const fmt = (p.media_type || 'VIDEO').toUpperCase();
    if (!formatMap[fmt]) formatMap[fmt] = [];
    formatMap[fmt].push((p as Record<string, number>)[likeKey] || 0);
  });
  let best = 'Video';
  let bestAvg = 0;
  Object.entries(formatMap).forEach(([fmt, likes]) => {
    const avg = average(likes);
    if (avg > bestAvg) {
      bestAvg = avg;
      best = FORMAT_LABELS[fmt] || fmt;
    }
  });
  return best;
}

export default function CrossPlatformAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [aiInsight, setAiInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [igData, ttData, ytData, igPosts, ttVideos, ytVideos] = await Promise.all([
        supabase.from('instagram_data').select('followers_count').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tiktok_data').select('followers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('youtube_data').select('subscribers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('instagram_posts').select('like_count, comments_count, media_type, timestamp').order('timestamp', { ascending: false }),
        supabase.from('tiktok_videos').select('likes, comments, created_at').order('created_at', { ascending: false }),
        supabase.from('youtube_videos').select('likes, comments, published_at').order('published_at', { ascending: false }),
      ]);

      const igPostsArr = igPosts.data || [];
      const ttVideosArr = ttVideos.data || [];
      const ytVideosArr = ytVideos.data || [];

      const igF = igData.data?.followers_count || 0;
      const ttF = ttData.data?.followers || 0;
      const ytS = ytData.data?.subscribers || 0;

      const igAL = average(igPostsArr.slice(0, 20).map((p) => p.like_count));
      const ttAL = average(ttVideosArr.slice(0, 20).map((v) => v.likes));
      const ytAL = average(ytVideosArr.slice(0, 20).map((v) => v.likes));

      const igAC = average(igPostsArr.slice(0, 20).map((p) => p.comments_count));
      const ttAC = average(ttVideosArr.slice(0, 20).map((v) => v.comments));
      const ytAC = average(ytVideosArr.slice(0, 20).map((v) => v.comments));

      const oneWeekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const weeklyIG = igPostsArr.filter((p) => p.timestamp >= oneWeekAgo).length;
      const weeklyTT = ttVideosArr.filter((v) => v.created_at >= oneWeekAgo).length;
      const weeklyYT = ytVideosArr.filter((v) => v.published_at >= oneWeekAgo).length;
      const weekly = weeklyIG + weeklyTT + weeklyYT;

      const engagements = [
        { name: 'Instagram', val: igF > 0 ? ((igAL + igAC) / igF) * 100 : 0 },
        { name: 'TikTok', val: ttF > 0 ? ((ttAL + ttAC) / ttF) * 100 : 0 },
        { name: 'YouTube', val: ytS > 0 ? ((ytAL + ytAC) / ytS) * 100 : 0 },
      ];
      const best = engagements.reduce((a, b) => (b.val > a.val ? b : a), engagements[0]);

      setStats({
        igFollowers: igF,
        ttFollowers: ttF,
        ytSubs: ytS,
        igAvgLikes: igAL,
        ttAvgLikes: ttAL,
        ytAvgLikes: ytAL,
        igAvgComments: igAC,
        ttAvgComments: ttAC,
        ytAvgComments: ytAC,
        igPostCount: igPostsArr.length,
        ttPostCount: ttVideosArr.length,
        ytPostCount: ytVideosArr.length,
        weeklyPosts: weekly,
        bestPlatform: best.name,
        igBestFormat: detectBestFormat(igPostsArr.slice(0, 20) as { media_type: string; like_count: number }[], 'like_count'),
        ttBestFormat: 'Video',
        ytBestFormat: 'Video',
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleAiInsight() {
    if (!stats) return;
    setInsightLoading(true);
    setAiInsight('');
    try {
      const systemPrompt = 'Du bist ein Social Media Stratege. Gib eine konkrete, umsetzbare Empfehlung auf Deutsch (max 4 Saetze). Kein Smalltalk.';
      const userMessage = `Hier sind die Plattform-Stats:\n- Instagram: ${stats.igFollowers} Follower, Avg ${stats.igAvgLikes} Likes, Avg ${stats.igAvgComments} Kommentare, ${stats.igPostCount} Posts, bestes Format: ${stats.igBestFormat}\n- TikTok: ${stats.ttFollowers} Follower, Avg ${stats.ttAvgLikes} Likes, Avg ${stats.ttAvgComments} Kommentare, ${stats.ttPostCount} Videos\n- YouTube: ${stats.ytSubs} Subs, Avg ${stats.ytAvgLikes} Likes, Avg ${stats.ytAvgComments} Kommentare, ${stats.ytPostCount} Videos\n- Posts diese Woche: ${stats.weeklyPosts}\n- Beste Plattform nach Engagement: ${stats.bestPlatform}\n\nGib eine konkrete Handlungsempfehlung.`;
      const result = await callClaude(systemPrompt, userMessage);
      setAiInsight(result);
    } catch {
      setAiInsight('AI Insight konnte nicht generiert werden.');
    } finally {
      setInsightLoading(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!stats) return <p className="text-jb-text-muted text-center py-12">Keine Daten verfuegbar.</p>;

  const totalFollowers = stats.igFollowers + stats.ttFollowers + stats.ytSubs;

  const likesCompare = [
    { name: 'Instagram', value: stats.igAvgLikes, color: '#E1306C' },
    { name: 'TikTok', value: stats.ttAvgLikes, color: '#00f2ea' },
    { name: 'YouTube', value: stats.ytAvgLikes, color: '#FF0000' },
  ];

  const commentsCompare = [
    { name: 'Instagram', value: stats.igAvgComments, color: '#E1306C' },
    { name: 'TikTok', value: stats.ttAvgComments, color: '#00f2ea' },
    { name: 'YouTube', value: stats.ytAvgComments, color: '#FF0000' },
  ];

  const postFrequency = [
    { name: 'Instagram', value: stats.igPostCount, color: '#E1306C' },
    { name: 'TikTok', value: stats.ttPostCount, color: '#00f2ea' },
    { name: 'YouTube', value: stats.ytPostCount, color: '#FF0000' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <BarChart3 size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Cross-Platform Analytics</h1>
          <p className="text-sm text-jb-text-secondary">Alle Plattformen im Vergleich</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Followers"
          value={formatNumber(totalFollowers)}
          icon={<Users size={15} />}
          accent
        />
        <StatCard
          label="Posts diese Woche"
          value={stats.weeklyPosts.toString()}
          icon={<FileText size={15} />}
        />
        <StatCard
          label="Beste Plattform"
          value={stats.bestPlatform}
          icon={<Award size={15} />}
          subtitle="nach Engagement"
        />
        <StatCard
          label="IG + TT + YT"
          value={`${formatNumber(stats.igFollowers)} / ${formatNumber(stats.ttFollowers)} / ${formatNumber(stats.ytSubs)}`}
          icon={<TrendingUp size={15} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4">Avg Likes</h3>
          <SimpleBarChart data={likesCompare} height={200} />
        </div>
        <div className="bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4">Avg Kommentare</h3>
          <SimpleBarChart data={commentsCompare} height={200} />
        </div>
        <div className="bg-jb-card border border-jb-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-jb-text mb-4">Post Frequenz (Gesamt)</h3>
          <SimpleBarChart data={postFrequency} height={200} />
        </div>
      </div>

      <div className="bg-jb-card border border-jb-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-jb-text mb-4 flex items-center gap-2">
          <Award size={15} className="text-jb-accent" /> Bestes Content-Format pro Plattform
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { platform: 'Instagram', format: stats.igBestFormat, color: 'border-jb-ig/30', textColor: 'text-jb-ig' },
            { platform: 'TikTok', format: stats.ttBestFormat, color: 'border-jb-tt/30', textColor: 'text-jb-tt' },
            { platform: 'YouTube', format: stats.ytBestFormat, color: 'border-jb-yt/30', textColor: 'text-jb-yt' },
          ].map((p) => (
            <div
              key={p.platform}
              className={`bg-jb-bg border ${p.color} rounded-xl p-4 text-center`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider ${p.textColor} mb-1`}>
                {p.platform}
              </p>
              <p className="stat-number text-xl text-jb-text">{p.format}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-jb-accent flex items-center gap-2">
            <Sparkles size={15} /> AI Insight
          </h3>
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles size={12} />}
            onClick={handleAiInsight}
            loading={insightLoading}
          >
            Generieren
          </Button>
        </div>
        {aiInsight ? (
          <p className="text-sm text-jb-text leading-relaxed whitespace-pre-wrap">{aiInsight}</p>
        ) : (
          <p className="text-xs text-jb-text-muted">
            Klicke auf "Generieren" um eine KI-basierte Handlungsempfehlung zu erhalten.
          </p>
        )}
      </div>
    </div>
  );
}
