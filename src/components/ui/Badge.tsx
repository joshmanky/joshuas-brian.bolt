// Badge: small label tag for platform, hook type, etc.
import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  color?: string;
  className?: string;
}

export default function Badge({ children, color = 'bg-jb-accent/10 text-jb-accent', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md ${color} ${className}`}>
      {children}
    </span>
  );
}
