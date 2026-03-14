// Media service: CRUD for media_library + file upload to Supabase Storage + AI analysis
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask, CLAUDE_MODELS } from './claude';
import type { MediaItem } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export async function getAllMedia(): Promise<MediaItem[]> {
  const { data } = await supabase
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as MediaItem[];
}

export async function uploadMedia(
  file: File,
  metadata: {
    mood: string;
    scene: string;
    has_face: boolean;
    speaking: boolean;
    tags: string[];
  }
): Promise<MediaItem | null> {
  const ext = file.name.split('.').pop() || '';
  const filePath = `${Date.now()}_${file.name}`;
  const isVideo = ['mp4', 'mov', 'webm'].includes(ext.toLowerCase());
  const fileType = isVideo ? 'video' : 'image';

  const { error: uploadError } = await supabase.storage
    .from('media')
    .upload(filePath, file);

  if (uploadError) throw new Error('Upload fehlgeschlagen: ' + uploadError.message);

  const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;
  const thumbnailUrl = fileType === 'image' ? fileUrl : null;

  let aiDescription = '';
  try {
    const systemPrompt = 'Du bist Content-Assistent fuer Joshua (DreamChasers Industry, H.I.S.-Methode). Analysiere Video-Metadaten und schreibe eine kurze AI-Description (max 2 Saetze) fuer welche Content-Themen dieses Video passt.';
    const userMsg = `Datei: ${file.name}, Typ: ${fileType}, Stimmung: ${metadata.mood}, Szene: ${metadata.scene}, Sprechen: ${metadata.speaking}, Gesicht: ${metadata.has_face}, Tags: ${metadata.tags.join(', ')}`;
    aiDescription = await callClaude(systemPrompt, userMsg, CLAUDE_MODELS.HAIKU, 250, 'Media Analyse Agent');
    await logAiTask('Media Analyse Agent', 'media_analysis', aiDescription);
  } catch {
    aiDescription = '';
  }

  const { data } = await supabase
    .from('media_library')
    .insert({
      file_url: fileUrl,
      filename: file.name,
      type: fileType,
      mood: metadata.mood,
      scene: metadata.scene,
      has_face: metadata.has_face,
      speaking: metadata.speaking,
      tags: metadata.tags,
      ai_description: aiDescription,
      thumbnail_url: thumbnailUrl,
    })
    .select()
    .maybeSingle();

  return data as MediaItem | null;
}

export async function deleteMedia(id: string): Promise<boolean> {
  const { data } = await supabase
    .from('media_library')
    .select('file_url')
    .eq('id', id)
    .maybeSingle();

  if (data?.file_url) {
    const path = data.file_url.split('/storage/v1/object/public/media/')[1];
    if (path) {
      await supabase.storage.from('media').remove([path]);
    }
  }

  const { error } = await supabase.from('media_library').delete().eq('id', id);
  return !error;
}

export async function matchVideoToScript(
  scriptHook: string,
  platform: string
): Promise<{ matched_id: string; reason: string } | null> {
  const { data: media } = await supabase
    .from('media_library')
    .select('id, filename, mood, scene, speaking, has_face, tags, ai_description');

  if (!media || media.length === 0) return null;

  const mediaJson = media.map((m) => ({
    id: m.id,
    filename: m.filename,
    mood: m.mood,
    scene: m.scene,
    speaking: m.speaking,
    has_face: m.has_face,
    tags: m.tags,
    ai_description: m.ai_description,
  }));

  const systemPrompt = 'Du matchst Videos zu Content-Skripten fuer Joshua (DreamChasers). Waehle das am besten passende Video.';
  const userMsg = `Skript Hook: ${scriptHook}. Plattform: ${platform}. Verfuegbare Videos: ${JSON.stringify(mediaJson)}. Antworte NUR mit JSON: {"matched_id": "uuid", "reason": "kurze Begruendung"}`;

  try {
    const result = await callClaude(systemPrompt, userMsg, CLAUDE_MODELS.HAIKU, 300, 'Video Matching Agent');
    await logAiTask('Video Matching Agent', 'video_matching', result);
    const clean = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export async function getMediaById(id: string): Promise<MediaItem | null> {
  const { data } = await supabase
    .from('media_library')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  return data as MediaItem | null;
}
