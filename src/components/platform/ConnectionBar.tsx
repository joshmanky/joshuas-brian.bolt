// ConnectionBar: shows connection status + refresh button for platform pages
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import Button from '../ui/Button';
import { formatTimeAgo } from '../../lib/utils';

interface ConnectionBarProps {
  connected: boolean;
  fetchedAt: string | null;
  loading: boolean;
  onRefresh: () => void;
  platformColor: string;
}

export default function ConnectionBar({ connected, fetchedAt, loading, onRefresh, platformColor }: ConnectionBarProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        {connected ? (
          <>
            <Wifi size={14} className={platformColor} />
            <span className={`text-xs font-medium ${platformColor}`}>Verbunden</span>
          </>
        ) : (
          <>
            <WifiOff size={14} className="text-jb-text-muted" />
            <span className="text-xs text-jb-text-muted">Nicht verbunden</span>
          </>
        )}
        {fetchedAt && (
          <span className="text-xs text-jb-text-muted ml-2">
            Aktualisiert: {formatTimeAgo(fetchedAt)}
          </span>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
        loading={loading}
        onClick={onRefresh}
        disabled={!connected}
      >
        Refresh
      </Button>
    </div>
  );
}
