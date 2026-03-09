// TikTok API service: fetch profile + videos via Apify actor
import { supabase } from '../lib/supabase';
import { getApiKey } from './apiKeys';
import type { TikTokData, TikTokVideo } from '../types';

const APIFY_API = 'https://api.apify.com/v2';
const ACTOR_ID = 'clockworks~tiktok-profile-scraper';

export async function fetchTikTokData(username: string): Promise<{ profile: TikTokData | null; videos: TikTokVideo[] }> {
  const token = await getApiKey('tiktok');
  if (!token) throw new Error('Apify API Token nicht konfiguriert. Bitte unter Settings eingeben.');

  const runRes = await fetch(`${APIFY_API}/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profiles: [username],
      resultsPerPage: 20,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    }),
  });

  if (!runRes.ok) throw new Error('Apify API Fehler: ' + runRes.statusText);
  const items = await runRes.json();

  if (!items || items.length === 0) throw new Error('Keine TikTok Daten gefunden.');

  const authorMeta = items[0]?.authorMeta || {};
  const profileData = {
    followers: authorMeta.fans || 0,
    total_likes: authorMeta.heart || 0,
    video_count: authorMeta.video || 0,
  };

  await supabase.from('tiktok_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data: savedProfile } = await supabase.from('tiktok_data').insert(profileData).select().maybeSingle();

  await supabase.from('tiktok_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const videosToInsert = items.map((v: Record<string, unknown>) => ({
    video_id: String(v.id || ''),
    description: String(v.text || ''),
    views: Number(v.playCount || 0),
    likes: Number(v.diggCount || 0),
    comments: Number(v.commentCount || 0),
    shares: Number(v.shareCount || 0),
    thumbnail_url: String((v.videoMeta as Record<string, unknown>)?.coverUrl || ''),
    created_at: v.createTimeISO ? String(v.createTimeISO) : new Date().toISOString(),
  }));

  if (videosToInsert.length > 0) {
    await supabase.from('tiktok_videos').insert(videosToInsert);
  }

  const { data: savedVideos } = await supabase
    .from('tiktok_videos')
    .select('*')
    .order('created_at', { ascending: false });

  return { profile: savedProfile as TikTokData | null, videos: (savedVideos || []) as TikTokVideo[] };
}

export async function getCachedTikTokData(): Promise<{ profile: TikTokData | null; videos: TikTokVideo[] }> {
  const { data: profile } = await supabase
    .from('tiktok_data')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: videos } = await supabase
    .from('tiktok_videos')
    .select('*')
    .order('created_at', { ascending: false });

  return { profile: profile as TikTokData | null, videos: (videos || []) as TikTokVideo[] };
}
