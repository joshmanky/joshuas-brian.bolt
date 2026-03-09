// ErrorBanner: error display with optional retry
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-jb-danger/5 border border-jb-danger/20 rounded-xl">
      <AlertTriangle size={18} className="text-jb-danger flex-shrink-0" />
      <p className="text-sm text-jb-danger flex-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-jb-danger bg-jb-danger/10 rounded-lg hover:bg-jb-danger/20 transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
