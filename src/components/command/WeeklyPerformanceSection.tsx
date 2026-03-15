// WeeklyPerformanceSection: This Week performance stats for Command Center
// Created: avg likes, best/worst post, trend arrow, hook type badges
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Flame, Minus, Heart, Eye, MessageSquare } from 'lucide-react';
import Badge from '../ui/Badge';
import { getWeeklyPerformanceStats, type WeeklyStats } from '../../services/pipeline';
import { HOOK_TYPE_LABELS } from '../../types';
import { getPlatformColor, formatNumber } from '../../lib/utils';
import type { HookType, PipelineCard } from '../../types';

export default function WeeklyPerformanceSection() {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyPerformanceStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 animate-pulse">
        <div className="h-4 bg-jb-border rounded w-48 mb-4" />
        <div className="space-y-2">
          <div className="h-8 bg-jb-border rounded" />
          <div className="h-8 bg-jb-border rounded" />
        </div>
      </div>
    );
  }

  if (!stats || stats.thisWeekCount === 0) {
    return (
      <div className="bg-jb-card border border-jb-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-jb-text flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-jb-accent" /> Diese Woche
        </h3>
        <p className="text-xs text-jb-text-muted text-center py-4">
          Noch keine Performance-Daten diese Woche. Trage Werte bei Published-Posts ein.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-jb-card border border-jb-accent/20 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-jb-text flex items-center gap-2">
          <TrendingUp size={14} className="text-jb-accent" /> Diese Woche
        </h3>
        {stats.trendBetter !== null && (
          <div className={`flex items-center gap-1 text-xs font-medium ${stats.trendBetter ? 'text-jb-success' : 'text-jb-danger'}`}>
            {stats.trendBetter ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {stats.trendBetter ? 'Besser' : 'Schlechter'} als letzte Woche
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatMini
          icon={<Heart size={12} className="text-jb-danger" />}
          label="Avg. Likes"
          value={formatNumber(stats.avgLikes)}
        />
        <StatMini
          icon={<Eye size={12} className="text-jb-accent" />}
          label="Posts"
          value={String(stats.thisWeekCount)}
        />
        <StatMini
          icon={<MessageSquare size={12} className="text-blue-400" />}
          label="Letzte Woche"
          value={formatNumber(stats.lastWeekAvgLikes)}
          sublabel="Avg. Likes"
        />
      </div>

      {stats.bestPost && (
        <PostRow card={stats.bestPost} label="Bester Post" type="best" />
      )}

      {stats.worstPost && (
        <PostRow card={stats.worstPost} label="Schlechtester Post" type="worst" />
      )}
    </div>
  );
}

function PostRow({ card, label, type }: { card: PipelineCard; label: string; type: 'best' | 'worst' }) {
  const platLabel = card.platform === 'instagram' ? 'IG' : card.platform === 'tiktok' ? 'TT' : 'YT';
  const hookLabel = HOOK_TYPE_LABELS[card.hook_type as HookType] || card.hook_type;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      type === 'best' ? 'bg-jb-success/5 border border-jb-success/15' : 'bg-jb-danger/5 border border-jb-danger/15'
    }`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
        type === 'best' ? 'bg-jb-success/10' : 'bg-jb-danger/10'
      }`}>
        {type === 'best'
          ? <Flame size={14} className="text-jb-success" />
          : <Minus size={14} className="text-jb-danger" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-jb-text-muted uppercase tracking-wider">{label}</p>
        <p className="text-sm text-jb-text truncate">{card.title}</p>
        <div className="flex items-center gap-1.5 mt-1">
          <Badge color={`${getPlatformColor(card.platform)} text-white`}>{platLabel}</Badge>
          <Badge>{hookLabel}</Badge>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-jb-text stat-number">{card.likes_48h}</p>
        <p className="text-[10px] text-jb-text-muted">Likes</p>
      </div>
    </div>
  );
}

function StatMini({ icon, label, value, sublabel }: { icon: React.ReactNode; label: string; value: string; sublabel?: string }) {
  return (
    <div className="bg-jb-bg rounded-lg p-2.5 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-base font-bold text-jb-text stat-number">{value}</p>
      <p className="text-[10px] text-jb-text-muted uppercase tracking-wider">{sublabel || label}</p>
    </div>
  );
}
