// API key management service: CRUD for platform API keys in Supabase
import { supabase } from '../lib/supabase';

export async function getApiKey(platform: string): Promise<string | null> {
  const { data } = await supabase
    .from('api_keys')
    .select('key_value')
    .eq('platform', platform)
    .maybeSingle();
  return data?.key_value || null;
}

export async function getAllApiKeys(): Promise<Record<string, string>> {
  const { data } = await supabase.from('api_keys').select('platform, key_value');
  const keys: Record<string, string> = {};
  data?.forEach((row) => {
    keys[row.platform] = row.key_value;
  });
  return keys;
}

export async function saveApiKey(platform: string, keyValue: string): Promise<boolean> {
  const { error } = await supabase
    .from('api_keys')
    .upsert({ platform, key_value: keyValue, updated_at: new Date().toISOString() }, { onConflict: 'platform' });
  return !error;
}
