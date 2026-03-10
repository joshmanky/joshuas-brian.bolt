// CanvaCallbackPage: handles OAuth redirect from Canva, exchanges code for token
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeCanvaCode } from '../services/canva/canvaService';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function CanvaCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) {
      setStatus('error');
      return;
    }

    exchangeCanvaCode(code).then(ok => {
      setStatus(ok ? 'success' : 'error');
      if (ok) {
        if (window.opener) {
          window.opener.postMessage({ type: 'CANVA_OAUTH_SUCCESS' }, '*');
          window.close();
        } else {
          setTimeout(() => navigate('/studio?tab=broll'), 1500);
        }
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-jb-bg flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <>
            <Loader size={40} className="text-jb-accent animate-spin mx-auto" />
            <p className="text-jb-text">Canva wird verbunden...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle size={40} className="text-green-400 mx-auto" />
            <p className="text-jb-text font-semibold">Canva erfolgreich verbunden!</p>
            <p className="text-jb-text-muted text-sm">Weiterleitung...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={40} className="text-red-400 mx-auto" />
            <p className="text-jb-text font-semibold">Verbindung fehlgeschlagen</p>
            <button
              onClick={() => navigate('/studio?tab=broll')}
              className="text-jb-accent text-sm underline"
            >
              Zurueck zum B-Roll Tab
            </button>
          </>
        )}
      </div>
    </div>
  );
}
