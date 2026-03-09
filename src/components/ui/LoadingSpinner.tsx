// LoadingSpinner: centered loading indicator
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ message = 'Laden...', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 ${className}`}>
      <Loader2 size={28} className="animate-spin text-jb-accent" />
      <p className="text-sm text-jb-text-secondary">{message}</p>
    </div>
  );
}
