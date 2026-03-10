// Canva Connect API service: OAuth, asset upload, design creation, export, master workflow
import { supabase } from '../../lib/supabase';

const CANVA_API = 'https://api.canva.com/rest/v1';
const CLIENT_ID = 'OC-AZzVO3qqx7Fz';
const REDIRECT_URI = 'https://joshua-brain-ai-soci-wysw.bolt.host/oauth/callback';

async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier));
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return { verifier, challenge };
}

export async function startCanvaOAuth(): Promise<void> {
  const { verifier, challenge } = await generatePKCE();
  localStorage.setItem('canva_code_verifier', verifier);

  const params = new URLSearchParams({
    code_challenge_method: 's256',
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'asset:read asset:write design:content:read design:content:write design:meta:read profile:read',
    code_challenge: challenge,
  });

  window.location.href = `https://www.canva.com/api/oauth/authorize?${params.toString()}`;
}

export async function exchangeCanvaCode(code: string, codeVerifier: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke('canva-token-exchange', {
    body: { code, code_verifier: codeVerifier, redirect_uri: REDIRECT_URI },
  });
  if (error || !data?.access_token) return false;
  await supabase.from('api_keys').upsert(
    { platform: 'canva_access_token', key_value: data.access_token },
    { onConflict: 'platform' }
  );
  if (data.refresh_token) {
    await supabase.from('api_keys').upsert(
      { platform: 'canva_refresh_token', key_value: data.refresh_token },
      { onConflict: 'platform' }
    );
  }
  return true;
}

async function getCanvaToken(): Promise<string | null> {
  const { data } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('platform', 'canva_access_token')
    .maybeSingle();
  return data?.key_value || null;
}

export async function isCanvaConnected(): Promise<boolean> {
  const token = await getCanvaToken();
  if (!token) return false;
  try {
    const res = await fetch(`${CANVA_API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function disconnectCanva(): Promise<void> {
  await supabase.from('api_keys').delete().eq('platform', 'canva_access_token');
  await supabase.from('api_keys').delete().eq('platform', 'canva_refresh_token');
}

export interface CanvaAsset {
  assetId: string;
  name: string;
  type: 'image' | 'video';
}

export async function uploadAssetToCanva(file: File, name: string): Promise<CanvaAsset> {
  const token = await getCanvaToken();
  if (!token) throw new Error('Nicht mit Canva verbunden');

  const initRes = await fetch(`${CANVA_API}/assets/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name_base64: btoa(unescape(encodeURIComponent(name))) }),
  });
  if (!initRes.ok) throw new Error('Asset Init fehlgeschlagen');

  const { job } = await initRes.json();
  await fetch(job.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });

  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`${CANVA_API}/assets/${job.asset_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { asset } = await pollRes.json();
    if (asset?.import_status?.status === 'success') {
      return { assetId: job.asset_id, name, type: file.type.startsWith('video') ? 'video' : 'image' };
    }
    if (asset?.import_status?.status === 'failed') throw new Error('Asset Verarbeitung fehlgeschlagen');
  }
  throw new Error('Asset Timeout');
}

export async function createBrollDesign(
  assetId: string,
  title: string,
  format: 'vertical' | 'square' = 'vertical'
): Promise<string> {
  const token = await getCanvaToken();
  if (!token) throw new Error('Nicht mit Canva verbunden');

  const dim = format === 'vertical'
    ? { width: 1080, height: 1920 }
    : { width: 1080, height: 1080 };

  const res = await fetch(`${CANVA_API}/designs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      design_type: { type: 'custom', ...dim, unit: 'px' },
      asset_id: assetId,
      title: title.slice(0, 50),
    }),
  });
  if (!res.ok) throw new Error('Design-Erstellung fehlgeschlagen');
  const { design } = await res.json();
  return design.id;
}

export interface ExportResult {
  status: 'success' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export async function exportDesign(
  designId: string,
  format: 'mp4' | 'png' | 'jpg' = 'mp4'
): Promise<ExportResult> {
  const token = await getCanvaToken();
  if (!token) throw new Error('Nicht mit Canva verbunden');

  const formatBody = format === 'mp4'
    ? { type: 'mp4', quality: 'vertical_1080p' }
    : format === 'jpg'
      ? { type: 'jpg', quality: 90 }
      : { type: 'png' };

  const res = await fetch(`${CANVA_API}/exports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ design_id: designId, format: formatBody }),
  });
  if (!res.ok) throw new Error('Export Start fehlgeschlagen');
  const { job } = await res.json();

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const pollRes = await fetch(`${CANVA_API}/exports/${job.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const { job: j } = await pollRes.json();
    if (j.status === 'success') return { status: 'success', downloadUrl: j.urls?.[0] };
    if (j.status === 'failed') return { status: 'failed', error: j.error?.message };
  }
  return { status: 'failed', error: 'Export Timeout' };
}

export interface WorkflowResult {
  success: boolean;
  designId?: string;
  exportUrl?: string;
  error?: string;
  steps: string[];
}

export async function runBrollWorkflow(
  file: File,
  overlayText: string,
  format: 'vertical' | 'square' = 'vertical',
  onStep?: (step: string) => void
): Promise<WorkflowResult> {
  const steps: string[] = [];
  const log = (s: string) => { steps.push(s); onStep?.(s); };

  try {
    log('Canva-Verbindung pruefen...');
    if (!(await isCanvaConnected())) {
      return { success: false, error: 'Nicht mit Canva verbunden.', steps };
    }

    log(`B-Roll hochladen: ${file.name}`);
    const asset = await uploadAssetToCanva(file, file.name);
    log(`Upload OK (Asset ID: ${asset.assetId})`);

    log('Design erstellen...');
    const designId = await createBrollDesign(asset.assetId, overlayText, format);
    log(`Design erstellt (ID: ${designId})`);

    log('Export als MP4 1080p...');
    const result = await exportDesign(designId, 'mp4');
    if (result.status !== 'success' || !result.downloadUrl) {
      return { success: false, error: result.error, steps, designId };
    }

    log('Export fertig! URL erhalten.');
    return { success: true, designId, exportUrl: result.downloadUrl, steps };
  } catch (err) {
    return { success: false, error: String(err), steps };
  }
}
