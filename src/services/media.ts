// Media service: CRUD for media_library + TUS resumable upload + AI Vision analysis
// Updated: switched to tus-js-client for chunked resumable uploads with progress tracking
import { supabase } from '../lib/supabase';
import { callClaude, logAiTask, CLAUDE_MODELS } from './claude';
import { extractVideoFrames, imageFileToBase64 } from '../utils/videoFrameExtractor';
import { uploadFileResumable } from './tusUpload';
import type { MediaItem } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const VISION_SYSTEM_PROMPT = `Du bist ein Content-Analyse-Assistent fuer Joshua (DreamChasers Industry, H.I.S.-Methode).
Analysiere die Bilder/Frames visuell und gib eine praezise Einschaetzung als JSON zurueck.

Antworte NUR mit diesem JSON-Format, KEIN anderer Text:
{
  "mood": "ruhig|energetisch|emotional|motivierend|humorvoll",
  "scene": "outdoor|indoor|urban|travel|gym|talking-head|lifestyle",
  "has_face": true/false,
  "speaking": true/false,
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "ai_description": "Kurze Beschreibung in 1-2 Saetzen was im Video/Bild zu sehen ist und fuer welchen Content es passt."
}

Regeln:
- tags: 3-5 Stichworte die den Inhalt beschreiben (z.B. strand, laptop, sonnenuntergang, fitness, reisen)
- ai_description: Beschreibe WAS zu sehen ist und fuer WELCHE Content-Themen es sich eignet
- has_face: Ist ein Gesicht/Person klar erkennbar?
- speaking: Sieht es so aus als ob jemand spricht (Mund offen, Kamera zugewandt)?`;

export interface AnalysisResult {
  mood: string;
  scene: string;
  has_face: boolean;
  speaking: boolean;
  tags: string[];
  ai_description: string;
}

export async function getAllMedia(): Promise<MediaItem[]> {
  const { data } = await supabase
    .from('media_library')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as MediaItem[];
}

export async function analyzeMediaVisually(file: File): Promise<{
  analysis: AnalysisResult;
  thumbnailDataUrl: string | null;
  duration: number | null;
}> {
  const isVideo = ['mp4', 'mov', 'webm', 'quicktime'].some((ext) =>
    file.type.includes(ext) || file.name.toLowerCase().endsWith(`.${ext}`)
  );

  let frames: string[] = [];
  let thumbnailDataUrl: string | null = null;
  let duration: number | null = null;

  if (isVideo) {
    const result = await extractVideoFrames(file);
    frames = result.frames;
    thumbnailDataUrl = result.thumbnailDataUrl;
    duration = result.duration;
  } else {
    const result = await imageFileToBase64(file);
    frames = [result.base64];
    thumbnailDataUrl = result.dataUrl;
  }

  const userMsg = isVideo
    ? `Analysiere diese ${frames.length} Frames aus einem Video. Bestimme Stimmung, Szene, ob ein Gesicht sichtbar ist, ob jemand spricht, und generiere passende Tags + Beschreibung.`
    : 'Analysiere dieses Bild. Bestimme Stimmung, Szene, ob ein Gesicht sichtbar ist, ob jemand spricht, und generiere passende Tags + Beschreibung.';

  const responseText = await callClaude(
    VISION_SYSTEM_PROMPT,
    userMsg,
    CLAUDE_MODELS.HAIKU,
    400,
    'Media Vision Agent',
    frames
  );

  await logAiTask('Media Vision Agent', 'media_vision_analysis', responseText);

  const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const analysis: AnalysisResult = JSON.parse(clean);

  return { analysis, thumbnailDataUrl, duration };
}

export async function uploadAndAnalyzeMedia(
  file: File,
  onStatus?: (status: string) => void,
  onProgress?: (percent: number) => void
): Promise<MediaItem | null> {
  onStatus?.('uploading');

  const ext = file.name.split('.').pop() || '';
  const filePath = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;
  const isVideo = ['mp4', 'mov', 'webm'].includes(ext.toLowerCase());
  const fileType = isVideo ? 'video' : 'image';

  await uploadFileResumable({
    bucketName: 'media',
    filePath,
    file,
    onProgress,
  });

  const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${filePath}`;

  onStatus?.('analyzing');

  let analysis: AnalysisResult = {
    mood: '',
    scene: '',
    has_face: false,
    speaking: false,
    tags: [],
    ai_description: '',
  };
  let thumbnailUrl: string | null = fileType === 'image' ? fileUrl : null;
  let durationSeconds: number | null = null;

  try {
    const result = await analyzeMediaVisually(file);
    analysis = result.analysis;
    durationSeconds = result.duration;

    if (result.thumbnailDataUrl && isVideo) {
      const thumbBlob = await (await fetch(result.thumbnailDataUrl)).blob();
      const thumbPath = `thumbs/${Date.now()}_thumb.jpg`;
      const { error: thumbErr } = await supabase.storage
        .from('media')
        .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg' });

      if (!thumbErr) {
        thumbnailUrl = `${SUPABASE_URL}/storage/v1/object/public/media/${thumbPath}`;
      }
    }
  } catch {
    // AI analysis failed — continue with empty metadata
  }

  onStatus?.('saving');

  const { data } = await supabase
    .from('media_library')
    .insert({
      file_url: fileUrl,
      filename: file.name,
      type: fileType,
      duration_seconds: durationSeconds,
      mood: analysis.mood || null,
      scene: analysis.scene || null,
      has_face: analysis.has_face,
      speaking: analysis.speaking,
      tags: analysis.tags.length > 0 ? analysis.tags : null,
      ai_description: analysis.ai_description || null,
      thumbnail_url: thumbnailUrl,
    })
    .select()
    .maybeSingle();

  onStatus?.('done');
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

export async function batchUpdateMedia(
  ids: string[],
  updates: Partial<Pick<MediaItem, 'mood' | 'scene' | 'tags'>>
): Promise<boolean> {
  const { error } = await supabase
    .from('media_library')
    .update(updates)
    .in('id', ids);
  return !error;
}

export async function batchDeleteMedia(ids: string[]): Promise<boolean> {
  const { data: items } = await supabase
    .from('media_library')
    .select('file_url')
    .in('id', ids);

  if (items) {
    const paths = items
      .map((i) => i.file_url?.split('/storage/v1/object/public/media/')[1])
      .filter(Boolean) as string[];
    if (paths.length > 0) {
      await supabase.storage.from('media').remove(paths);
    }
  }

  const { error } = await supabase.from('media_library').delete().in('id', ids);
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
