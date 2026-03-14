// MediaUploadForm: drag-and-drop upload with metadata form for media library
import { useState, useRef, useCallback } from 'react';
import { Upload, X, Film, ImageIcon } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';

const MOOD_OPTIONS = [
  { value: '', label: 'Stimmung waehlen...' },
  { value: 'ruhig', label: 'Ruhig' },
  { value: 'energetisch', label: 'Energetisch' },
  { value: 'emotional', label: 'Emotional' },
  { value: 'motivierend', label: 'Motivierend' },
  { value: 'humorvoll', label: 'Humorvoll' },
];

const SCENE_OPTIONS = [
  { value: '', label: 'Szene waehlen...' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'indoor', label: 'Indoor' },
  { value: 'urban', label: 'Urban' },
  { value: 'travel', label: 'Travel' },
  { value: 'gym', label: 'Gym' },
  { value: 'talking-head', label: 'Talking Head' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

const ACCEPTED_TYPES = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXT = '.mp4,.mov,.jpg,.jpeg,.png,.webp';

interface MediaUploadFormProps {
  onUploaded: () => void;
  onUpload: (file: File, metadata: { mood: string; scene: string; has_face: boolean; speaking: boolean; tags: string[] }) => Promise<void>;
  uploading: boolean;
}

export default function MediaUploadForm({ onUploaded, onUpload, uploading }: MediaUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mood, setMood] = useState('');
  const [scene, setScene] = useState('');
  const [hasFace, setHasFace] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED_TYPES.includes(f.type)) return;
    setFile(f);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  }

  async function handleSubmit() {
    if (!file || !mood || !scene) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await onUpload(file, { mood, scene, has_face: hasFace, speaking, tags });
    setFile(null);
    setPreview(null);
    setMood('');
    setScene('');
    setHasFace(false);
    setSpeaking(false);
    setTagsInput('');
    onUploaded();
  }

  function clearFile() {
    setFile(null);
    setPreview(null);
  }

  const isVideo = file?.type.startsWith('video/');

  return (
    <div className="bg-jb-card border border-jb-border rounded-xl p-5 space-y-4">
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver ? 'border-jb-accent bg-jb-accent/5' : 'border-jb-border hover:border-jb-border-light'
          }`}
        >
          <Upload size={32} className="mx-auto text-jb-text-muted mb-3" />
          <p className="text-sm text-jb-text font-medium">Datei hierher ziehen oder klicken</p>
          <p className="text-xs text-jb-text-muted mt-1">MP4, MOV, JPG, PNG, WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXT}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 bg-jb-bg border border-jb-border rounded-lg p-3">
            <div className="w-12 h-12 rounded-lg bg-jb-accent/10 flex items-center justify-center flex-shrink-0">
              {preview ? (
                <img src={preview} alt="" className="w-12 h-12 rounded-lg object-cover" />
              ) : isVideo ? (
                <Film size={20} className="text-jb-accent" />
              ) : (
                <ImageIcon size={20} className="text-jb-accent" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-jb-text font-medium truncate">{file.name}</p>
              <p className="text-xs text-jb-text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>
            <button onClick={clearFile} className="text-jb-text-muted hover:text-jb-danger transition-colors">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Stimmung" options={MOOD_OPTIONS} value={mood} onChange={(e) => setMood(e.target.value)} />
            <Select label="Szene" options={SCENE_OPTIONS} value={scene} onChange={(e) => setScene(e.target.value)} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setSpeaking(!speaking)}
                className={`w-10 h-5 rounded-full transition-colors relative ${speaking ? 'bg-jb-accent' : 'bg-jb-border'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${speaking ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-jb-text">Ich spreche</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setHasFace(!hasFace)}
                className={`w-10 h-5 rounded-full transition-colors relative ${hasFace ? 'bg-jb-accent' : 'bg-jb-border'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${hasFace ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-sm text-jb-text">Gesicht sichtbar</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-medium text-jb-text-secondary mb-1.5 uppercase tracking-wider">Tags</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="thailand, freiheit, lifestyle"
              className="w-full bg-jb-bg border border-jb-border rounded-lg px-3 py-2.5 text-sm text-jb-text placeholder:text-jb-text-muted focus:outline-none focus:border-jb-accent/50 focus:ring-1 focus:ring-jb-accent/20 transition-colors"
            />
          </div>

          <Button
            onClick={handleSubmit}
            loading={uploading}
            disabled={!mood || !scene}
            className="w-full"
          >
            {uploading ? 'Wird hochgeladen & analysiert...' : 'Hochladen & KI analysieren'}
          </Button>
        </>
      )}
    </div>
  );
}
