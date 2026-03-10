// CanvaCallbackPage: handles same-tab OAuth redirect from Canva, exchanges code for token
// Reads codeVerifier from sessionStorage (same tab context), then redirects to /settings
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCanvaCode } from '../services/canva/canvaService';

export default function CanvaCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error || !code) {
        setStatus('error');
        setErrorMsg(error || 'Kein Code erhalten');
        return;
      }

      const codeVerifier = sessionStorage.getItem('canva_code_verifier');

      if (!codeVerifier) {
        setStatus('error');
        setErrorMsg('Session abgelaufen. Bitte erneut verbinden.');
        return;
      }

      try {
        const ok = await exchangeCanvaCode(code, codeVerifier);
        sessionStorage.removeItem('canva_code_verifier');
        if (ok) {
          setStatus('success');
          setTimeout(() => navigate('/settings'), 1500);
        } else {
          setStatus('error');
          setErrorMsg('Token Exchange fehlgeschlagen');
        }
      } catch (err: unknown) {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Token Exchange fehlgeschlagen');
      }
    }

    handleCallback();
  }, [searchParams, navigate]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0c0c0e] text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b8f94a] mx-auto mb-4" />
          <p className="text-gray-400">Canva wird verbunden...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0c0c0e] text-white">
        <div className="text-center">
          <div className="text-green-400 text-4xl mb-4">&#10003;</div>
          <p className="text-white font-semibold">Canva verbunden!</p>
          <p className="text-gray-400 text-sm mt-1">Weiterleitung zu Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-[#0c0c0e] text-white">
      <div className="text-center">
        <div className="text-red-400 text-4xl mb-4">&#10007;</div>
        <p className="text-white font-semibold">Verbindung fehlgeschlagen</p>
        <p className="text-gray-400 text-sm mt-2">{errorMsg}</p>
        <button
          onClick={() => navigate('/settings')}
          className="mt-6 px-6 py-2 bg-[#b8f94a] text-[#0c0c0e] rounded-lg font-medium hover:bg-[#a8e93a] transition-colors"
        >
          Zurueck zu Settings
        </button>
      </div>
    </div>
  );
}
