// CanvaStatusWidget: shows Canva connection status with connect/disconnect + popup blocker fallback
import { useState, useEffect } from 'react';
import { isCanvaConnected, startCanvaOAuth, disconnectCanva } from '../../services/canva/canvaService';
import Button from '../ui/Button';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function CanvaStatusWidget() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [popupBlockedUrl, setPopupBlockedUrl] = useState<string | null>(null);

  useEffect(() => {
    isCanvaConnected().then(c => {
      setConnected(c);
      setLoading(false);
    });
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'CANVA_OAUTH_SUCCESS') {
        isCanvaConnected().then(setConnected);
        setPopupBlockedUrl(null);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (loading) {
    return <p className="text-xs text-jb-text-muted">Status wird geprueft...</p>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connected
            ? <CheckCircle size={14} className="text-green-400" />
            : <XCircle size={14} className="text-red-400" />
          }
          <span className="text-sm text-jb-text">
            {connected ? 'Verbunden' : 'Nicht verbunden'}
          </span>
        </div>
        {connected ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => disconnectCanva().then(() => setConnected(false))}
          >
            Trennen
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={async () => {
              setPopupBlockedUrl(null);
              const fallbackUrl = await startCanvaOAuth();
              if (fallbackUrl) setPopupBlockedUrl(fallbackUrl);
            }}
          >
            Verbinden
          </Button>
        )}
      </div>

      {popupBlockedUrl && !connected && (
        <div className="bg-jb-warning/5 border border-jb-warning/20 rounded-lg p-2.5">
          <p className="text-[11px] text-jb-warning mb-1">Popup blockiert. Klicke hier:</p>
          <a
            href={popupBlockedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-jb-accent hover:underline font-medium"
          >
            <ExternalLink size={11} />
            Canva Autorisierung oeffnen
          </a>
        </div>
      )}
    </div>
  );
}
