// TikTokPage: TikTok analytics with profile stats, video grid, engagement trends
import { useState, useEffect, useCallback } from 'react';
import { Music2, Users, Heart, Eye, Video } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import ErrorBanner from '../components/ui/ErrorBanner';
import ConnectionBar from '../components/platform/ConnectionBar';
import MediaGrid from '../components/platform/MediaGrid';
import SimpleLineChart from '../components/charts/SimpleLineChart';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { fetchTikTokData, getCachedTikTokData } from '../services/tiktok';
import { getApiKey } from '../services/apiKeys';
import { formatNumber, average } from '../lib/utils';
import type { TikTokData, TikTokVideo } from '../types';

export default function TikTokPage() {
  const [profile, setProfile] = useState<TikTokData | null>(null);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [username, setUsername] = useState('joshmanky');

  useEffect(() => {
    Promise.all([
      getApiKey('tiktok').then((k) => setHasToken(!!k)),
      getCachedTikTokData().then(({ profile: p, videos: vs }) => {
        if (p) setProfile(p);
        if (vs.length) setVideos(vs);
      }),
    ]).finally(() => setInitialLoad(false));
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!username.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { profile: p, videos: vs } = await fetchTikTokData(username.trim());
      if (p) setProfile(p);
      setVideos(vs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [username]);

  const avgViews = average(videos.slice(0, 10).map((v) => v.views));
  const followers = profile?.followers || 0;
  const viewsRatioData = videos.slice(0, 20).reverse().map((v, i) => ({
    name: `#${i + 1}`,
    value: followers > 0 ? Math.round((v.views / followers) * 100) : 0,
  }));

  const mediaItems = videos.map((v) => ({
    id: v.id,
    thumbnail_url: v.thumbnail_url,
    description: v.description,
    likes: v.likes,
    comments: v.comments,
    views: v.views,
    shares: v.shares,
    engagementRate: v.views > 0 ? ((v.likes + v.comments) / v.views * 100).toFixed(1) : '0',
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-tt/10 flex items-center justify-center">
          <Music2 size={20} className="text-jb-tt" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">TikTok</h1>
          <p className="text-sm text-jb-text-secondary">Analyse und Performance</p>
        </div>
      </div>

      {hasToken && (
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <Input
              label="TikTok Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@joshmanky"
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
        platformColor="text-jb-tt"
      />

      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {!hasToken && !profile && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-8 text-center">
          <Music2 size={32} className="text-jb-text-muted mx-auto mb-3" />
          <p className="text-sm text-jb-text-secondary mb-1">TikTok nicht verbunden</p>
          <p className="text-xs text-jb-text-muted">Gehe zu Settings und gib deinen Apify API Token ein.</p>
        </div>
      )}

      {profile && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Followers" value={formatNumber(profile.followers)} icon={<Users size={15} />} />
            <StatCard label="Total Likes" value={formatNumber(profile.total_likes)} icon={<Heart size={15} />} />
            <StatCard label="Videos" value={formatNumber(profile.video_count)} icon={<Video size={15} />} />
            <StatCard label="Avg Views" value={formatNumber(avgViews)} icon={<Eye size={15} />} accent subtitle="Letzte 10" />
          </div>

          {viewsRatioData.length > 0 && (
            <div className="bg-jb-card border border-jb-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-jb-text mb-4 flex items-center gap-2">
                <Eye size={15} className="text-jb-tt" /> Views / Followers Ratio (%)
              </h3>
              <SimpleLineChart data={viewsRatioData} color="#00f2ea" height={200} />
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-jb-text mb-3">Letzte {videos.length} Videos</h3>
            <MediaGrid items={mediaItems} platform="tiktok" />
          </div>
        </>
      )}
    </div>
  );
}
