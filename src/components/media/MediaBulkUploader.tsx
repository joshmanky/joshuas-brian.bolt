// MediaBulkUploader: drag-and-drop multi-file upload with AI Vision analysis queue
// Replaces the old single-file MediaUploadForm with bulk processing + progress tracking
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Film, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, FolderOpen } from 'lucide-react';
import Button from '../ui/Button';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = '.mp4,.mov,.jpg,.jpeg,.png,.webp';

export type FileStatus = 'queued' | 'uploading' | 'analyzing' | 'saving' | 'done' | 'error';

export interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  error?: string;
}

interface MediaBulkUploaderProps {
  onProcessFile: (file: File, onStatus: (status: string) => void) => Promise<void>;
  onAllDone: () => void;
}

export default function MediaBulkUploader({ onProcessFile, onAllDone }: MediaBulkUploaderProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const abortRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const accepted = Array.from(files).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXT.split(',').some((ext) => f.name.toLowerCase().endsWith(ext))
    );
    if (accepted.length === 0) return;

    const newItems: QueuedFile[] = accepted.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      status: 'queued' as FileStatus,
    }));

    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }

  function removeFromQueue(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  function clearCompleted() {
    setQueue((prev) => prev.filter((q) => q.status !== 'done' && q.status !== 'error'));
  }

  async function startProcessing() {
    abortRef.current = false;
    setProcessing(true);

    const pending = queue.filter((q) => q.status === 'queued');

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) break;

      const item = pending[i];
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' as FileStatus } : q))
      );

      try {
        await onProcessFile(item.file, (status) => {
          setQueue((prev) =>
            prev.map((q) => (q.id === item.id ? { ...q, status: status as FileStatus } : q))
          );
        });

        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done' as FileStatus } : q))
        );
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error' as FileStatus, error: err instanceof Error ? err.message : 'Fehler' }
              : q
          )
        );
      }
    }

    setProcessing(false);
    onAllDone();
  }

  function stopProcessing() {
    abortRef.current = true;
  }

  const queuedCount = queue.filter((q) => q.status === 'queued').length;
  const doneCount = queue.filter((q) => q.status === 'done').length;
  const errorCount = queue.filter((q) => q.status === 'error').length;
  const totalCount = queue.length;

  const statusConfig: Record<FileStatus, { label: string; color: string; icon: React.ReactNode }> = {
    queued: { label: 'Wartend', color: 'text-jb-text-muted', icon: null },
    uploading: { label: 'Hochladen...', color: 'text-jb-accent', icon: <Loader2 size={14} className="animate-spin" /> },
    analyzing: { label: 'KI analysiert...', color: 'text-blue-400', icon: <Loader2 size={14} className="animate-spin" /> },
    saving: { label: 'Speichern...', color: 'text-jb-warning', icon: <Loader2 size={14} className="animate-spin" /> },
    done: { label: 'Fertig', color: 'text-jb-success', icon: <CheckCircle size={14} /> },
    error: { label: 'Fehler', color: 'text-jb-danger', icon: <AlertCircle size={14} /> },
  };

  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-5 space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          dragOver ? 'border-jb-accent bg-jb-accent/5' : 'border-jb-border hover:border-jb-border-light'
        }`}
      >
        <Upload size={28} className="mx-auto text-jb-text-muted mb-2" />
        <p className="text-sm text-jb-text font-medium">Dateien hierher ziehen</p>
        <p className="text-xs text-jb-text-muted mt-1 mb-3">MP4, MOV, JPG, PNG, WEBP -- mehrere gleichzeitig</p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs text-jb-accent hover:text-jb-accent-dim transition-colors font-medium px-3 py-1.5 rounded-lg border border-jb-accent/20 hover:border-jb-accent/40"
          >
            Dateien waehlen
          </button>
          <button
            onClick={() => folderRef.current?.click()}
            className="text-xs text-jb-text-secondary hover:text-jb-text transition-colors font-medium px-3 py-1.5 rounded-lg border border-jb-border hover:border-jb-border-light flex items-center gap-1.5"
          >
            <FolderOpen size={12} />
            Ordner waehlen
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          multiple
          onChange={handleInputChange}
          className="hidden"
        />
        <input
          ref={folderRef}
          type="file"
          accept={ACCEPTED_EXT}
          // @ts-expect-error webkitdirectory is not in standard types
          webkitdirectory=""
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {queue.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-jb-text">{totalCount} Dateien</span>
              {processing && (
                <span className="text-xs text-jb-accent">
                  {doneCount} / {totalCount - errorCount} verarbeitet
                </span>
              )}
              {!processing && doneCount > 0 && (
                <span className="text-xs text-jb-success">{doneCount} fertig</span>
              )}
              {errorCount > 0 && (
                <span className="text-xs text-jb-danger">{errorCount} Fehler</span>
              )}
            </div>
            <div className="flex gap-2">
              {(doneCount > 0 || errorCount > 0) && !processing && (
                <button
                  onClick={clearCompleted}
                  className="text-xs text-jb-text-muted hover:text-jb-text transition-colors"
                >
                  Abgeschlossene entfernen
                </button>
              )}
            </div>
          </div>

          {processing && (
            <div className="w-full bg-jb-bg rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-jb-accent rounded-full transition-all duration-300"
                style={{ width: `${((doneCount + errorCount) / totalCount) * 100}%` }}
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {queue.map((item) => {
              const isVideo = item.file.type.startsWith('video/');
              const cfg = statusConfig[item.status];
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.status === 'done' ? 'bg-jb-success/5' : item.status === 'error' ? 'bg-jb-danger/5' : 'bg-jb-bg'
                  }`}
                >
                  <div className="w-7 h-7 rounded bg-jb-card flex items-center justify-center flex-shrink-0">
                    {isVideo ? <Film size={14} className="text-jb-text-muted" /> : <ImageIcon size={14} className="text-jb-text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-jb-text truncate">{item.file.name}</p>
                    <p className="text-[10px] text-jb-text-muted">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <div className={`flex items-center gap-1.5 flex-shrink-0 ${cfg.color}`}>
                    {cfg.icon}
                    <span className="text-[10px] font-medium">{cfg.label}</span>
                  </div>
                  {item.status === 'queued' && !processing && (
                    <button
                      onClick={() => removeFromQueue(item.id)}
                      className="text-jb-text-muted hover:text-jb-danger transition-colors flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            {!processing && queuedCount > 0 && (
              <Button onClick={startProcessing} className="flex-1">
                {queuedCount} Dateien hochladen & KI analysieren
              </Button>
            )}
            {processing && (
              <Button onClick={stopProcessing} className="flex-1 !bg-jb-danger/10 !text-jb-danger !border-jb-danger/20 hover:!bg-jb-danger/20">
                Abbrechen
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
