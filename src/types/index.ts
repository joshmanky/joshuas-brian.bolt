// Type definitions for Joshua Brain

export interface ApiKey {
  id: string;
  platform: 'instagram' | 'tiktok' | 'youtube' | 'claude';
  key_value: string;
  created_at: string;
  updated_at: string;
}

export interface InstagramData {
  id: string;
  followers_count: number;
  media_count: number;
  fetched_at: string;
}

export interface InstagramPost {
  id: string;
  ig_id: string;
  caption: string;
  like_count: number;
  comments_count: number;
  media_type: string;
  media_url: string;
  thumbnail_url: string;
  timestamp: string;
  fetched_at: string;
}

export interface TikTokData {
  id: string;
  followers: number;
  total_likes: number;
  video_count: number;
  fetched_at: string;
}

export interface TikTokVideo {
  id: string;
  video_id: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  thumbnail_url: string;
  created_at: string;
  fetched_at: string;
}

export interface YouTubeData {
  id: string;
  subscribers: number;
  total_views: number;
  video_count: number;
  fetched_at: string;
}

export interface YouTubeVideo {
  id: string;
  yt_id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  comments: number;
  published_at: string;
  fetched_at: string;
}

export type PipelineStatus =
  | 'idee'
  | 'skript_fertig'
  | 'in_bearbeitung'
  | 'editing'
  | 'scheduled'
  | 'published';

export interface PipelineCard {
  id: string;
  title: string;
  platform: string;
  hook_type: string;
  status: PipelineStatus;
  script_content: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface BrainDocument {
  id: string;
  filename: string;
  category: string;
  file_path: string;
  extracted_quotes: string[];
  extracted_insights: string[];
  full_text: string;
  created_at: string;
}

export interface AiTaskLog {
  id: string;
  task_type: string;
  input_summary: string;
  output_summary: string;
  created_at: string;
}

export type HookType =
  | 'identitaets_hook'
  | 'frage_hook'
  | 'zahlen_hook'
  | 'kontrast_hook'
  | 'statement_hook';

export const HOOK_TYPE_LABELS: Record<HookType, string> = {
  identitaets_hook: 'Identitaets-Hook',
  frage_hook: 'Frage-Hook',
  zahlen_hook: 'Zahlen-Hook',
  kontrast_hook: 'Kontrast-Hook',
  statement_hook: 'Statement-Hook',
};

export const PIPELINE_COLUMNS: { key: PipelineStatus; label: string }[] = [
  { key: 'idee', label: 'Idee' },
  { key: 'skript_fertig', label: 'Skript fertig' },
  { key: 'in_bearbeitung', label: 'In Bearbeitung' },
  { key: 'editing', label: 'Editing' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'published', label: 'Published' },
];

export const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram Reel', color: 'bg-jb-ig' },
  { value: 'tiktok', label: 'TikTok', color: 'bg-jb-tt' },
  { value: 'youtube', label: 'YouTube Short', color: 'bg-jb-yt' },
];

export type ResearchStatus = 'New' | 'In Pipeline' | 'Done';

export interface ContentResearchItem {
  id: string;
  topic: string;
  hook_suggestion: string;
  platform: 'instagram' | 'tiktok' | 'youtube';
  status: ResearchStatus;
  source: 'manual' | 'ai_generated' | 'trending';
  created_at: string;
}

export type SopCategory = 'Content' | 'Sales' | 'Operations' | 'Training' | 'Tech';

export interface SopDocument {
  id: string;
  title: string;
  category: SopCategory;
  description: string;
  created_at: string;
  updated_at: string;
}
