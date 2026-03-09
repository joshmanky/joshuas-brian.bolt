// Utility functions for Joshua Brain

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString('de-DE');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'gerade eben';
  if (minutes < 60) return `vor ${minutes}m`;
  if (hours < 24) return `vor ${hours}h`;
  if (days < 7) return `vor ${days}d`;
  return formatDate(dateStr);
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '****';
  return '****' + key.slice(-4);
}

export function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function detectHookType(caption: string): string | null {
  if (!caption) return null;
  const lower = caption.toLowerCase();
  if (/\?/.test(caption) && lower.length < 200) return 'frage_hook';
  if (/du bist|du warst|du wirst|wenn du/.test(lower)) return 'identitaets_hook';
  if (/\d+%|\d+\s*(tipps?|schritte?|wege?|fehler|gründe)/.test(lower)) return 'zahlen_hook';
  if (/aber|statt|nicht\.{0,3}\s*sondern|anstatt|trotzdem/.test(lower)) return 'kontrast_hook';
  return 'statement_hook';
}

export function getPlatformColor(platform: string): string {
  switch (platform) {
    case 'instagram': return 'bg-jb-ig';
    case 'tiktok': return 'bg-jb-tt';
    case 'youtube': return 'bg-jb-yt';
    default: return 'bg-jb-accent';
  }
}

export function getPlatformTextColor(platform: string): string {
  switch (platform) {
    case 'instagram': return 'text-jb-ig';
    case 'tiktok': return 'text-jb-tt';
    case 'youtube': return 'text-jb-yt';
    default: return 'text-jb-accent';
  }
}
