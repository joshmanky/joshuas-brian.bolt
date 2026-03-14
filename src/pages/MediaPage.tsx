// MediaPage: Mediathek — upload and manage media files (videos/images) for content pipeline
import { useState, useEffect, useCallback } from 'react';
import { Film } from 'lucide-react';
import MediaUploadForm from '../components/media/MediaUploadForm';
import MediaGrid from '../components/media/MediaGrid';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { getAllMedia, uploadMedia, deleteMedia } from '../services/media';
import type { MediaItem } from '../types';

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadMedia = useCallback(async () => {
    const data = await getAllMedia();
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadMedia(); }, [loadMedia]);

  async function handleUpload(
    file: File,
    metadata: { mood: string; scene: string; has_face: boolean; speaking: boolean; tags: string[] }
  ) {
    setUploading(true);
    try {
      await uploadMedia(file, metadata);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteMedia(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-jb-accent/10 flex items-center justify-center">
          <Film size={20} className="text-jb-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-jb-text">Mediathek</h1>
          <p className="text-sm text-jb-text-secondary">{items.length} Dateien hochgeladen</p>
        </div>
      </div>

      <MediaUploadForm onUploaded={loadMedia} onUpload={handleUpload} uploading={uploading} />

      {loading ? <LoadingSpinner /> : (
        <MediaGrid items={items} onDelete={handleDelete} />
      )}
    </div>
  );
}
