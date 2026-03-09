// StatCard: reusable KPI display card with icon, label, and mono number
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  accent?: boolean;
}

export default function StatCard({ label, value, icon, subtitle, accent }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-colors ${
        accent
          ? 'bg-jb-card border-jb-accent/20 accent-glow'
          : 'bg-jb-card border-jb-border hover:border-jb-border-light'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-jb-text-secondary">{icon}</span>}
        <span className="text-xs font-medium uppercase tracking-wider text-jb-text-secondary">
          {label}
        </span>
      </div>
      <p className="stat-number text-2xl sm:text-3xl text-jb-text">{value}</p>
      {subtitle && (
        <p className="text-xs text-jb-text-muted mt-1">{subtitle}</p>
      )}
    </div>
  );
}
