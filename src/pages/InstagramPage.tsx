// InstagramPage: Instagram analytics with profile stats, media grid, hook analysis, viral scores
import { useState, useEffect, useCallback } from 'react';
import { Instagram, Users, Image, Heart, MessageCircle, BarChart3, Clock } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import ErrorBanner from '../components/ui/ErrorBanner';
import ConnectionBar from '../components/platform/ConnectionBar';
import MediaGrid from '../components/platform/MediaGrid';
import SimpleBarChart from '../components/charts/SimpleBarChart';
import { fetchInstagramData, getCachedInstagramData } from '../services/instagram';
import { getApiKey } from '../services/apiKeys';
import { formatNumber, average, detectHookType } from '../lib/utils';
import type { InstagramData, InstagramPost } from '../types';

export default function InstagramPage() {
  const [profile, setProfile] = useState<InstagramData | null>(null);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    Promise.all([
      getApiKey('instagram').then((k) => setHasToken(!!k)),
      getCachedInstagramData().then(({ profile: p, posts: ps }) => {
        if (p) setProfile(p);
        if (ps.length) setPosts(ps);
      }),
    ]).finally(() => setInitialLoad(false));
  }, []);

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { profile: p, posts: ps } = await fetchInstagramData();
      if (p) setProfile(p);
      setPosts(ps);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  const avgLikes = average(posts.slice(0, 10).map((p) => p.like_count));
  const avgComments = average(posts.slice(0, 10).map((p) => p.comments_count));
  const bestPost = posts.length ? posts.reduce((a, b) => (a.like_count > b.like_count ? a : b)) : null;
  const reels = posts.filter((p) => p.media_type === 'VIDEO').length;
  const photos = posts.filter((p) => p.media_type === 'IMAGE').length;
  const carousels = posts.filter((p) => p.media_type === 'CAROUSEL_ALBUM').length;

  const hookCounts = posts.reduce<Record<string, number>>((acc, p) => {
    const hook = detectHookType(p.caption);
    if (hook) acc[hook] = (acc[hook] || 0) + 1;
    return acc;
  }, {});
  const hookData = [
    { name: 'Frage', value: hookCounts['frage_hook'] || 0, color: '#3b82f6' },
    { name: 'Identitaet', value: hookCounts['identitaets_hook'] || 0, color: '#f59e0b' },
    { name: 'Zahlen', value: hookCounts['zahlen_hook'] || 0, color: '#22c55e' },
    { name: 'Kontrast', value: hookCounts['kontrast_hook'] || 0, color: '#ef4444' },
    { name: 'Statement', value: hookCounts['statement_hook'] || 0, color: '#8b5cf6' },
  ];

  const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const dayCounts = posts.reduce<Record<string, number>>((acc, p) => {
    const day = dayNames[new Date(p.timestamp).getDay()];
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const dayData = dayNames.map((d) => ({ name: d, value: dayCounts[d] || 0 }));

  const allAvgLikes = average(posts.map((p) => p.like_count));

  const mediaItems = posts.map((p) => ({
    id: p.id,
    thumbnail_url: p.thumbnail_url || p.media_url,
    media_url: p.media_url,
    caption: p.caption,
    like_count: p.like_count,
    comments_count: p.comments_count,
    media_type: p.media_type,
    isBest: bestPost?.id === p.id,
    viralScore: allAvgLikes > 0 ? Math.min(999, Math.round((p.like_count / allAvgLikes) * 100)) : undefined,
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
        <div className="w-10 h-10 rounded-xl bg-jb-ig/10 flex items-center justify-center">
          <Instagram size={20} className="text-jb-ig" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Instagram</h1>
          <p className="text-sm text-jb-text-secondary">Analyse und Performance</p>
        </div>
      </div>

      <ConnectionBar
        connected={hasToken}
        fetchedAt={profile?.fetched_at || null}
        loading={loading}
        onRefresh={handleRefresh}
        platformColor="text-jb-ig"
      />

      {error && <ErrorBanner message={error} onRetry={handleRefresh} />}

      {!hasToken && !profile && (
        <div className="bg-jb-card border border-jb-border rounded-xl p-8 text-center">
          <Instagram size={32} className="text-jb-text-muted mx-auto mb-3" />
          <p className="text-sm text-jb-text-secondary mb-1">Instagram nicht verbunden</p>
          <p className="text-xs text-jb-text-muted">Gehe zu Settings und gib deinen Instagram Access Token ein.</p>
        </div>
      )}

      {profile && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Followers" value={formatNumber(profile.followers_count)} icon={<Users size={15} />} />
            <StatCard label="Beitraege" value={formatNumber(profile.media_count)} icon={<Image size={15} />} />
            <StatCard label="Avg Likes" value={formatNumber(avgLikes)} icon={<Heart size={15} />} subtitle="Letzte 10" />
            <StatCard label="Avg Comments" value={formatNumber(avgComments)} icon={<MessageCircle size={15} />} subtitle="Letzte 10" />
            <StatCard label="Reels" value={`${reels}/${posts.length}`} icon={<BarChart3 size={15} />} subtitle={`${photos} Fotos, ${carousels} Car.`} />
            <StatCard label="Best Post" value={formatNumber(bestPost?.like_count || 0)} icon={<Heart size={15} />} accent subtitle="Likes" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-jb-card border border-jb-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-jb-text mb-4 flex items-center gap-2">
                <BarChart3 size={15} className="text-jb-accent" /> Hook-Typ Analyse
              </h3>
              <SimpleBarChart data={hookData} height={180} />
            </div>
            <div className="bg-jb-card border border-jb-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-jb-text mb-4 flex items-center gap-2">
                <Clock size={15} className="text-jb-accent" /> Posting-Tag Verteilung
              </h3>
              <SimpleBarChart data={dayData} height={180} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-jb-text mb-3">Letzte {posts.length} Beitraege</h3>
            <MediaGrid items={mediaItems} platform="instagram" />
          </div>
        </>
      )}
    </div>
  );
}
