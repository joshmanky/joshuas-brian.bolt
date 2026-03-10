// YouTubeTab: YouTube analytics with channel stats, video grid, conversion metrics
import { useState, useEffect, useCallback } from 'react';
import { Youtube, Users, Eye, Video, ThumbsUp, TrendingUp } from 'lucide-react';
import StatCard from '../../components/ui/StatCard';
import ErrorBanner from '../../components/ui/ErrorBanner';
import ConnectionBar from '../../components/platform/ConnectionBar';
import MediaGrid from '../../components/platform/MediaGrid';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { fetchYouTubeData, getCachedYouTubeData } from '../../services/youtube';
import { getApiKey } from '../../services/apiKeys';
import { formatNumber, average } from '../../lib/utils';
import type { YouTubeData, YouTubeVideo } from '../../types';

export default function YouTubeTab() {
  const [profile, setProfile] = useState<YouTubeData | null>(null);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    Promise.all([
      getApiKey('youtube').then((k) => setHasToken(!!k)),
      getCachedYouTubeData().then(({ profile: p, videos: vs }) => {
        if (p) setProfile(p);
        if (vs.length) setVideos(vs);
      }),
    ]).finally(() => setInitialLoad(false));
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!channelId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { profile: p, videos: vs } = await fetchYouTubeData(channelId.trim());
      if (p) setProfile(p);
      setVideos(vs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  const avgViews = average(videos.slice(0, 10).map((v) => v.views));
  const subs = profile?.subscribers || 1;
  const retentionProxy = subs > 0 ? ((avgViews / subs) * 100).toFixed(1) : '0';
  const topByConversion = videos.length
    ? videos.reduce((a, b) => ((a.views / subs) > (b.views / subs) ? a : b))
    : null;

  const mediaItems = videos.map((v) => ({
    id: v.id,
    thumbnail_url: v.thumbnail_url,
    title: v.title,
    likes: v.likes,
    comments: v.comments,
    views: v.views,
    isBest: topByConversion?.id === v.id,
    engagementRate: subs > 0 ? ((v.views / subs) * 100).toFixed(1) : '0',
  }));

  if (initialLoad) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="shimmer h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasToken && (
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Input
              label="YouTube Channel ID"
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="UCxxxxxxx..."
            />
          </div>
          <Button variant="secondary" size="md" onClick={handleRefresh} loading={loading}>
            Daten laden
          </Button>
        </div>
      )}

      <ConnectionBar
        connected={hasToken}
        fetchedAt={profile?.fetched_at || null}
        loading={loading}
        onRefresh={handleRefresh}
        platformColor="text-jb-yt"
      />

      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {!hasToken && !profile && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-8 text-center">
          <Youtube size={32} className="text-jb-text-muted mx-auto mb-3" />
          <p className="text-sm text-jb-text-secondary mb-1">YouTube nicht verbunden</p>
          <p className="text-xs text-jb-text-muted">Gehe zu Settings und gib deinen YouTube API Key ein.</p>
        </div>
      )}

      {profile && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard label="Subscribers" value={formatNumber(profile.subscribers)} icon={<Users size={15} />} />
            <StatCard label="Total Views" value={formatNumber(profile.total_views)} icon={<Eye size={15} />} />
            <StatCard label="Videos" value={formatNumber(profile.video_count)} icon={<Video size={15} />} />
            <StatCard label="Avg Views" value={formatNumber(avgViews)} icon={<ThumbsUp size={15} />} subtitle="Letzte 10" />
            <StatCard label="Retention" value={`${retentionProxy}%`} icon={<TrendingUp size={15} />} accent subtitle="Views/Subs" />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-jb-text mb-3">Letzte {videos.length} Videos</h3>
            <MediaGrid items={mediaItems} platform="youtube" />
          </div>
        </>
      )}
    </div>
  );
}
