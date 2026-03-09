// Performance data service: shared helper for fetching top-performing posts across platforms
import { supabase } from '../lib/supabase';

export interface TopPost {
  caption: string;
  likes: number;
  platform: string;
  views?: number;
}

export interface PerformanceSnapshot {
  topIgPosts: TopPost[];
  topTtVideos: TopPost[];
  igFollowers: number;
  ttFollowers: number;
  ytSubs: number;
}

export async function fetchTopPerformanceData(): Promise<PerformanceSnapshot> {
  const [igPosts, ttVideos, igData, ttData, ytData] = await Promise.all([
    supabase
      .from('instagram_posts')
      .select('caption, like_count, media_type')
      .order('like_count', { ascending: false })
      .limit(5),
    supabase
      .from('tiktok_videos')
      .select('description, likes, views')
      .order('likes', { ascending: false })
      .limit(3),
    supabase.from('instagram_data').select('followers_count').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('tiktok_data').select('followers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('youtube_data').select('subscribers').order('fetched_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    topIgPosts: (igPosts.data || []).map((p) => ({
      caption: (p.caption || '').slice(0, 150),
      likes: p.like_count,
      platform: 'instagram',
    })),
    topTtVideos: (ttVideos.data || []).map((v) => ({
      caption: (v.description || '').slice(0, 150),
      likes: v.likes,
      views: v.views,
      platform: 'tiktok',
    })),
    igFollowers: igData.data?.followers_count || 0,
    ttFollowers: ttData.data?.followers || 0,
    ytSubs: ytData.data?.subscribers || 0,
  };
}

export function buildPerformanceContext(data: PerformanceSnapshot): string {
  const parts: string[] = [];

  if (data.topIgPosts.length > 0) {
    const igLines = data.topIgPosts
      .map((p, i) => `${i + 1}. "${p.caption}" (${p.likes} Likes)`)
      .join('\n');
    parts.push(`Deine Top Instagram Posts:\n${igLines}`);
  }

  if (data.topTtVideos.length > 0) {
    const ttLines = data.topTtVideos
      .map((p, i) => `${i + 1}. "${p.caption}" (${p.likes} Likes, ${p.views || 0} Views)`)
      .join('\n');
    parts.push(`Deine Top TikToks:\n${ttLines}`);
  }

  const stats: string[] = [];
  if (data.igFollowers) stats.push(`Instagram Followers: ${data.igFollowers}`);
  if (data.ttFollowers) stats.push(`TikTok Followers: ${data.ttFollowers}`);
  if (data.ytSubs) stats.push(`YouTube Subscribers: ${data.ytSubs}`);
  if (stats.length > 0) parts.push(stats.join('\n'));

  return parts.join('\n\n');
}
