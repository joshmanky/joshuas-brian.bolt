// YouTube API service: fetch channel stats + videos via Data API v3
import { supabase } from '../lib/supabase';
import { getApiKey } from './apiKeys';
import type { YouTubeData, YouTubeVideo } from '../types';

const YT_API = 'https://www.googleapis.com/youtube/v3';

export async function fetchYouTubeData(channelId: string): Promise<{ profile: YouTubeData | null; videos: YouTubeVideo[] }> {
  const apiKey = await getApiKey('youtube');
  if (!apiKey) throw new Error('YouTube API Key nicht konfiguriert. Bitte unter Settings eingeben.');

  const channelRes = await fetch(`${YT_API}/channels?part=statistics&id=${channelId}&key=${apiKey}`);
  if (!channelRes.ok) throw new Error('YouTube API Fehler: ' + channelRes.statusText);
  const channelJson = await channelRes.json();
  const stats = channelJson.items?.[0]?.statistics;
  if (!stats) throw new Error('YouTube Kanal nicht gefunden.');

  const searchRes = await fetch(
    `${YT_API}/search?part=snippet&channelId=${channelId}&maxResults=20&order=date&type=video&key=${apiKey}`
  );
  if (!searchRes.ok) throw new Error('YouTube Search API Fehler: ' + searchRes.statusText);
  const searchJson = await searchRes.json();
  const videoIds = (searchJson.items || []).map((i: Record<string, Record<string, string>>) => i.id.videoId).join(',');

  let videoDetails: Record<string, unknown>[] = [];
  if (videoIds) {
    const videosRes = await fetch(
      `${YT_API}/videos?part=statistics,snippet&id=${videoIds}&key=${apiKey}`
    );
    if (videosRes.ok) {
      const videosJson = await videosRes.json();
      videoDetails = videosJson.items || [];
    }
  }

  await supabase.from('youtube_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data: savedProfile } = await supabase.from('youtube_data').insert({
    subscribers: Number(stats.subscriberCount || 0),
    total_views: Number(stats.viewCount || 0),
    video_count: Number(stats.videoCount || 0),
  }).select().maybeSingle();

  await supabase.from('youtube_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const videosToInsert = videoDetails.map((v: Record<string, unknown>) => {
    const snippet = v.snippet as Record<string, unknown>;
    const vStats = v.statistics as Record<string, string>;
    const thumbs = snippet.thumbnails as Record<string, Record<string, string>>;
    return {
      yt_id: v.id as string,
      title: (snippet.title as string) || '',
      thumbnail_url: thumbs?.medium?.url || thumbs?.default?.url || '',
      views: Number(vStats?.viewCount || 0),
      likes: Number(vStats?.likeCount || 0),
      comments: Number(vStats?.commentCount || 0),
      published_at: snippet.publishedAt as string,
    };
  });

  if (videosToInsert.length > 0) {
    await supabase.from('youtube_videos').insert(videosToInsert);
  }

  const { data: savedVideos } = await supabase
    .from('youtube_videos')
    .select('*')
    .order('published_at', { ascending: false });

  return { profile: savedProfile as YouTubeData | null, videos: (savedVideos || []) as YouTubeVideo[] };
}

export async function getCachedYouTubeData(): Promise<{ profile: YouTubeData | null; videos: YouTubeVideo[] }> {
  const { data: profile } = await supabase
    .from('youtube_data')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: videos } = await supabase
    .from('youtube_videos')
    .select('*')
    .order('published_at', { ascending: false });

  return { profile: profile as YouTubeData | null, videos: (videos || []) as YouTubeVideo[] };
}
