// MediaBulkUploader: drag-and-drop multi-file upload with TUS resumable uploads
// Updated: per-file progress bars, retry button, file size validation, error details
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Film, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, FolderOpen, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = '.mp4,.mov,.jpg,.jpeg,.png,.webp';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export type FileStatus = 'queued' | 'uploading' | 'analyzing' | 'saving' | 'done' | 'error';

export interface QueuedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
}

interface MediaBulkUploaderProps {
  onProcessFile: (
    file: File,
    onStatus: (status: string) => void,
    onProgress: (percent: number) => void
  ) => Promise<void>;
  onAllDone: () => void;
}

export default function MediaBulkUploader({ onProcessFile, onAllDone }: MediaBulkUploaderProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [rejected, setRejected] = useState<string[]>([]);
  const abortRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback((files: FileList | File[]) => {
    const all = Array.from(files).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXT.split(',').some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    const tooLarge: string[] = [];
    const accepted: File[] = [];

    for (const f of all) {
      if (f.size > MAX_FILE_SIZE) {
        tooLarge.push(`${f.name} (${(f.size / 1024 / 1024).toFixed(0)} MB)`);
      } else {
        accepted.push(f);
      }
    }

    if (tooLarge.length > 0) {
      setRejected(tooLarge);
      setTimeout(() => setRejected([]), 8000);
    }

    if (accepted.length === 0) return;

    const newItems: QueuedFile[] = accepted.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      file,
      status: 'queued' as FileStatus,
      progress: 0,
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

  function updateItem(id: string, patch: Partial<QueuedFile>) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  async function processItem(item: QueuedFile) {
    updateItem(item.id, { status: 'uploading', progress: 0, error: undefined });

    try {
      await onProcessFile(
        item.file,
        (status) => updateItem(item.id, { status: status as FileStatus }),
        (percent) => updateItem(item.id, { progress: percent })
      );
      updateItem(item.id, { status: 'done', progress: 100 });
    } catch (err) {
      updateItem(item.id, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    }
  }

  async function startProcessing() {
    abortRef.current = false;
    setProcessing(true);

    const pending = queue.filter((q) => q.status === 'queued');

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) break;
      await processItem(pending[i]);
    }

    setProcessing(false);
    onAllDone();
  }

  async function retryItem(id: string) {
    const item = queue.find((q) => q.id === id);
    if (!item) return;

    setProcessing(true);
    await processItem(item);
    setProcessing(false);
    onAllDone();
  }

  async function retryAllFailed() {
    const failed = queue.filter((q) => q.status === 'error');
    if (failed.length === 0) return;

    abortRef.current = false;
    setProcessing(true);

    for (const item of failed) {
      if (abortRef.current) break;
      await processItem(item);
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

  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-5 space-y-4">
      <DropZone
        dragOver={dragOver}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        inputRef={inputRef}
        folderRef={folderRef}
        onInputChange={handleInputChange}
      />

      {rejected.length > 0 && (
        <div className="bg-jb-danger/10 border border-jb-danger/20 rounded-lg px-3 py-2 text-xs text-jb-danger space-y-1">
          <p className="font-medium">Dateien zu gross (max. 500 MB):</p>
          {rejected.map((name, i) => (
            <p key={i} className="text-jb-danger/80">{name}</p>
          ))}
        </div>
      )}

      {queue.length > 0 && (
        <>
          <QueueHeader
            totalCount={totalCount}
            doneCount={doneCount}
            errorCount={errorCount}
            processing={processing}
            onClearCompleted={clearCompleted}
          />

          {processing && (
            <div className="w-full bg-jb-bg rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-jb-accent rounded-full transition-all duration-300"
                style={{ width: `${((doneCount + errorCount) / totalCount) * 100}%` }}
              />
            </div>
          )}

          <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
            {queue.map((item) => (
              <QueueItem
                key={item.id}
                item={item}
                processing={processing}
                onRemove={removeFromQueue}
                onRetry={retryItem}
              />
            ))}
          </div>

          <div className="flex gap-2">
            {!processing && queuedCount > 0 && (
              <Button onClick={startProcessing} className="flex-1">
                {queuedCount} Dateien hochladen & KI analysieren
              </Button>
            )}
            {!processing && errorCount > 0 && queuedCount === 0 && (
              <Button onClick={retryAllFailed} className="flex-1">
                <RotateCcw size={14} className="mr-1.5" />
                {errorCount} fehlgeschlagene erneut versuchen
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

function DropZone({
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  inputRef,
  folderRef,
  onInputChange,
}: {
  dragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  folderRef: React.RefObject<HTMLInputElement>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
        dragOver ? 'border-jb-accent bg-jb-accent/5' : 'border-jb-border hover:border-jb-border-light'
      }`}
    >
      <Upload size={28} className="mx-auto text-jb-text-muted mb-2" />
      <p className="text-sm text-jb-text font-medium">Dateien hierher ziehen</p>
      <p className="text-xs text-jb-text-muted mt-1 mb-3">MP4, MOV, JPG, PNG, WEBP -- max. 500 MB pro Datei</p>
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
        onChange={onInputChange}
        className="hidden"
      />
      <input
        ref={folderRef}
        type="file"
        accept={ACCEPTED_EXT}
        // @ts-expect-error webkitdirectory is not in standard types
        webkitdirectory=""
        onChange={onInputChange}
        className="hidden"
      />
    </div>
  );
}

function QueueHeader({
  totalCount,
  doneCount,
  errorCount,
  processing,
  onClearCompleted,
}: {
  totalCount: number;
  doneCount: number;
  errorCount: number;
  processing: boolean;
  onClearCompleted: () => void;
}) {
  return (
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
            onClick={onClearCompleted}
            className="text-xs text-jb-text-muted hover:text-jb-text transition-colors"
          >
            Abgeschlossene entfernen
          </button>
        )}
      </div>
    </div>
  );
}

const STATUS_CONFIG: Record<FileStatus, { label: string; color: string; icon: React.ReactNode }> = {
  queued: { label: 'Wartend', color: 'text-jb-text-muted', icon: null },
  uploading: { label: 'Hochladen', color: 'text-jb-accent', icon: <Loader2 size={14} className="animate-spin" /> },
  analyzing: { label: 'KI analysiert...', color: 'text-blue-400', icon: <Loader2 size={14} className="animate-spin" /> },
  saving: { label: 'Speichern...', color: 'text-jb-warning', icon: <Loader2 size={14} className="animate-spin" /> },
  done: { label: 'Fertig', color: 'text-jb-success', icon: <CheckCircle size={14} /> },
  error: { label: 'Fehler', color: 'text-jb-danger', icon: <AlertCircle size={14} /> },
};

function QueueItem({
  item,
  processing,
  onRemove,
  onRetry,
}: {
  item: QueuedFile;
  processing: boolean;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const isVideo = item.file.type.startsWith('video/');
  const cfg = STATUS_CONFIG[item.status];
  const isUploading = item.status === 'uploading';
  const sizeMB = (item.file.size / 1024 / 1024).toFixed(1);

  return (
    <div
      className={`px-3 py-2 rounded-lg transition-colors ${
        item.status === 'done' ? 'bg-jb-success/5' : item.status === 'error' ? 'bg-jb-danger/5' : 'bg-jb-bg'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-jb-card flex items-center justify-center flex-shrink-0">
          {isVideo ? <Film size={14} className="text-jb-text-muted" /> : <ImageIcon size={14} className="text-jb-text-muted" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-jb-text truncate">{item.file.name}</p>
          <p className="text-[11px] text-jb-text-muted">{sizeMB} MB</p>
        </div>
        <div className={`flex items-center gap-1.5 flex-shrink-0 ${cfg.color}`}>
          {cfg.icon}
          <span className="text-[10px] font-medium">
            {isUploading ? `${item.progress}%` : cfg.label}
          </span>
        </div>
        {item.status === 'queued' && !processing && (
          <button
            onClick={() => onRemove(item.id)}
            className="text-jb-text-muted hover:text-jb-danger transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
        {item.status === 'error' && !processing && (
          <button
            onClick={() => onRetry(item.id)}
            className="text-jb-text-muted hover:text-jb-accent transition-colors flex-shrink-0"
            title="Nochmal versuchen"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {isUploading && (
        <div className="mt-1.5 ml-10 mr-8">
          <div className="w-full bg-jb-bg rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-jb-accent rounded-full transition-all duration-200"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      )}

      {item.status === 'error' && item.error && (
        <p className="mt-1 ml-10 text-[10px] text-jb-danger/80 truncate">{item.error}</p>
      )}
    </div>
  );
}
