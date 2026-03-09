// MediaGrid: reusable grid with optional viral score badges for Instagram posts
import { Heart, MessageCircle, Eye, Share2, Trophy, TrendingUp } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatNumber } from '../../lib/utils';

interface MediaItem {
  id: string;
  thumbnail_url?: string;
  media_url?: string;
  caption?: string;
  title?: string;
  description?: string;
  like_count?: number;
  likes?: number;
  comments_count?: number;
  comments?: number;
  views?: number;
  shares?: number;
  media_type?: string;
  isBest?: boolean;
  engagementRate?: string;
  viralScore?: number;
}

function getViralScoreBadge(score: number | undefined) {
  if (score === undefined) return null;
  let color = 'bg-red-500/15 text-red-400';
  if (score >= 150) color = 'bg-emerald-500/15 text-emerald-400';
  else if (score >= 80) color = 'bg-amber-500/15 text-amber-400';
  return (
    <Badge color={color}>
      <TrendingUp size={9} className="mr-0.5" /> {score}
    </Badge>
  );
}

interface MediaGridProps {
  items: MediaItem[];
  platform: 'instagram' | 'tiktok' | 'youtube';
}

function getMediaTypeBadge(type: string | undefined) {
  if (!type) return null;
  const normalized = type.toUpperCase();
  if (normalized === 'VIDEO' || normalized.includes('REEL')) return <Badge color="bg-jb-accent/10 text-jb-accent">Reel</Badge>;
  if (normalized === 'CAROUSEL_ALBUM') return <Badge color="bg-blue-500/10 text-blue-400">Carousel</Badge>;
  if (normalized === 'IMAGE') return <Badge color="bg-amber-500/10 text-amber-400">Foto</Badge>;
  return null;
}

export default function MediaGrid({ items, platform }: MediaGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const likes = item.like_count ?? item.likes ?? 0;
        const comments = item.comments_count ?? item.comments ?? 0;
        const text = item.caption || item.title || item.description || '';

        return (
          <div
            key={item.id}
            className={`bg-jb-card border rounded-xl overflow-hidden transition-all hover:border-jb-border-light group ${
              item.isBest ? 'border-jb-accent/40 accent-glow' : 'border-jb-border'
            }`}
          >
            <div className="relative aspect-square bg-jb-bg overflow-hidden">
              {(item.thumbnail_url || item.media_url) ? (
                <img
                  src={item.thumbnail_url || item.media_url}
                  alt={text.slice(0, 50)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-jb-text-muted text-xs">
                  Kein Bild
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-1">
                {platform === 'instagram' && getMediaTypeBadge(item.media_type)}
                {item.isBest && (
                  <Badge color="bg-jb-accent text-jb-bg">
                    <Trophy size={10} className="mr-0.5" /> TOP
                  </Badge>
                )}
              </div>
              {item.viralScore !== undefined && (
                <div className="absolute top-2 right-2">
                  {getViralScoreBadge(item.viralScore)}
                </div>
              )}
              {item.engagementRate && (
                <div className="absolute bottom-2 right-2">
                  <Badge color="bg-black/60 text-white backdrop-blur-sm">{item.engagementRate}%</Badge>
                </div>
              )}
            </div>

            <div className="p-3">
              <p className="text-xs text-jb-text-secondary line-clamp-2 mb-2 min-h-[2rem]">
                {text.slice(0, 100) || '—'}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-jb-text-muted">
                <span className="flex items-center gap-1">
                  <Heart size={11} /> <span className="stat-number">{formatNumber(likes)}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} /> <span className="stat-number">{formatNumber(comments)}</span>
                </span>
                {item.views !== undefined && (
                  <span className="flex items-center gap-1">
                    <Eye size={11} /> <span className="stat-number">{formatNumber(item.views)}</span>
                  </span>
                )}
                {item.shares !== undefined && item.shares > 0 && (
                  <span className="flex items-center gap-1">
                    <Share2 size={11} /> <span className="stat-number">{formatNumber(item.shares)}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
