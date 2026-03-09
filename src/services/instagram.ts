// Instagram API service: fetch profile + media from Graph API v21.0
import { supabase } from '../lib/supabase';
import { getApiKey } from './apiKeys';
import type { InstagramData, InstagramPost } from '../types';

const GRAPH_API = 'https://graph.instagram.com/v21.0';

export async function fetchInstagramData(): Promise<{ profile: InstagramData | null; posts: InstagramPost[] }> {
  const token = await getApiKey('instagram');
  if (!token) throw new Error('Instagram Access Token nicht konfiguriert. Bitte unter Settings eingeben.');

  const profileRes = await fetch(`${GRAPH_API}/me?fields=id,username,media_count,followers_count&access_token=${token}`);
  if (!profileRes.ok) throw new Error('Instagram API Fehler: ' + profileRes.statusText);
  const profileJson = await profileRes.json();

  const mediaRes = await fetch(
    `${GRAPH_API}/me/media?fields=id,caption,like_count,comments_count,media_type,media_url,thumbnail_url,timestamp&limit=20&access_token=${token}`
  );
  if (!mediaRes.ok) throw new Error('Instagram Media API Fehler: ' + mediaRes.statusText);
  const mediaJson = await mediaRes.json();

  await supabase.from('instagram_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const { data: savedProfile } = await supabase.from('instagram_data').insert({
    followers_count: profileJson.followers_count || 0,
    media_count: profileJson.media_count || 0,
  }).select().maybeSingle();

  await supabase.from('instagram_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  const postsToInsert = (mediaJson.data || []).map((m: Record<string, unknown>) => ({
    ig_id: m.id as string,
    caption: (m.caption as string) || '',
    like_count: (m.like_count as number) || 0,
    comments_count: (m.comments_count as number) || 0,
    media_type: (m.media_type as string) || 'IMAGE',
    media_url: (m.media_url as string) || '',
    thumbnail_url: (m.thumbnail_url as string) || (m.media_url as string) || '',
    timestamp: m.timestamp as string,
  }));

  if (postsToInsert.length > 0) {
    await supabase.from('instagram_posts').insert(postsToInsert);
  }

  const { data: savedPosts } = await supabase
    .from('instagram_posts')
    .select('*')
    .order('timestamp', { ascending: false });

  return { profile: savedProfile as InstagramData | null, posts: (savedPosts || []) as InstagramPost[] };
}

export async function getCachedInstagramData(): Promise<{ profile: InstagramData | null; posts: InstagramPost[] }> {
  const { data: profile } = await supabase
    .from('instagram_data')
    .select('*')
    .order('fetched_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: posts } = await supabase
    .from('instagram_posts')
    .select('*')
    .order('timestamp', { ascending: false });

  return { profile: profile as InstagramData | null, posts: (posts || []) as InstagramPost[] };
}
