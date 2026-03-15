// Video frame extraction utility: extracts frames from video files using HTML5 video+canvas
// Used by media upload to send visual frames to Claude Vision for AI analysis

const FRAME_MAX_WIDTH = 512;
const JPEG_QUALITY = 0.6;
const FRAME_POSITIONS = [0.25, 0.5, 0.75];

export interface ExtractedFrames {
  frames: string[];
  duration: number;
  thumbnailDataUrl: string;
}

function createVideoElement(file: File): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      if (video.duration === 0 || !isFinite(video.duration)) {
        URL.revokeObjectURL(url);
        reject(new Error('Video hat keine gueltige Laenge'));
        return;
      }
      resolve(video);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Video konnte nicht geladen werden'));
    };
  });
}

function seekToTime(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    video.currentTime = time;
    video.onseeked = () => resolve();
  });
}

function captureFrame(video: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, FRAME_MAX_WIDTH / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(',')[1] || '';
}

export async function extractVideoFrames(file: File): Promise<ExtractedFrames> {
  const video = await createVideoElement(file);
  const duration = video.duration;
  const frames: string[] = [];
  let thumbnailDataUrl = '';

  for (let i = 0; i < FRAME_POSITIONS.length; i++) {
    const time = duration * FRAME_POSITIONS[i];
    await seekToTime(video, time);
    const dataUrl = captureFrame(video);
    frames.push(dataUrlToBase64(dataUrl));

    if (i === 1) {
      thumbnailDataUrl = dataUrl;
    }
  }

  URL.revokeObjectURL(video.src);

  return { frames, duration: Math.round(duration), thumbnailDataUrl };
}

export async function imageFileToBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, FRAME_MAX_WIDTH / img.width);
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      URL.revokeObjectURL(url);
      resolve({ base64: dataUrlToBase64(dataUrl), dataUrl });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bild konnte nicht geladen werden'));
    };

    img.src = url;
  });
}
