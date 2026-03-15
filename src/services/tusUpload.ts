// TUS resumable upload utility for Supabase Storage
// Handles chunked uploads with progress tracking and retry support
import * as tus from 'tus-js-client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB (required by Supabase)

const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
const TUS_ENDPOINT = `https://${projectRef}.supabase.co/storage/v1/upload/resumable`;

export interface TusUploadOptions {
  bucketName: string;
  filePath: string;
  file: File;
  onProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
}

export function uploadFileResumable({
  bucketName,
  filePath,
  file,
  onProgress,
  onError,
}: TusUploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: TUS_ENDPOINT,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: CHUNK_SIZE,
      removeFingerprintOnSuccess: true,
      headers: {
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'x-upsert': 'true',
      },
      metadata: {
        bucketName,
        objectName: filePath,
        contentType: file.type,
        cacheControl: '3600',
      },
      onError(err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[TUS] Upload failed for ${file.name}:`, error.message);
        onError?.(error);
        reject(error);
      },
      onProgress(bytesUploaded, bytesTotal) {
        const percent = Math.round((bytesUploaded / bytesTotal) * 100);
        onProgress?.(percent);
      },
      onSuccess() {
        console.log(`[TUS] Upload complete: ${file.name}`);
        resolve();
      },
    });

    console.log(`[TUS] Starting upload: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        console.log(`[TUS] Resuming previous upload for ${file.name}`);
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    });
  });
}
