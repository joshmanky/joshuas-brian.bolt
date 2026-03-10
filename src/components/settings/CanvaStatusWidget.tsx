// CanvaStatusWidget: shows Canva connection status with connect/disconnect actions
import { useState, useEffect } from 'react';
import { isCanvaConnected, startCanvaOAuth, disconnectCanva } from '../../services/canva/canvaService';
import Button from '../ui/Button';
import { CheckCircle, XCircle } from 'lucide-react';

export default function CanvaStatusWidget() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isCanvaConnected().then(c => {
      setConnected(c);
      setLoading(false);
    });
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'CANVA_OAUTH_SUCCESS') {
        isCanvaConnected().then(setConnected);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  if (loading) {
    return <p className="text-xs text-jb-text-muted">Status wird geprueft...</p>;
  }

  return (
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
        <Button size="sm" onClick={() => startCanvaOAuth()}>
          Verbinden
        </Button>
      )}
    </div>
  );
}
