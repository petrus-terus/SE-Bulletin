export const SESB_GRADIENTS = [
  { id: 'green', name: 'Kinabalu Forest', gradient: 'linear-gradient(135deg, #1A7A5A 0%, #0E4432 100%)', stops: ['#1A7A5A', '#0E4432'] },
  { id: 'blue', name: 'Sabah Blue', gradient: 'linear-gradient(135deg, #0055A4 0%, #002D5A 100%)', stops: ['#0055A4', '#002D5A'] },
  { id: 'amber', name: 'Sunset Amber', gradient: 'linear-gradient(135deg, #D97706 0%, #92400E 100%)', stops: ['#D97706', '#92400E'] },
  { id: 'slate', name: 'Night Grid', gradient: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', stops: ['#1E293B', '#0F172A'] },
];

/**
 * Creates an image dataURL from a gradient and text content via HTML5 Canvas
 */
export function createTextCardImage(text: string, gradient: string, authorName: string, deptName: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('No canvas context'));

  // Background
  const linear = ctx.createLinearGradient(0, 0, 1080, 1920);
  const matched = SESB_GRADIENTS.find((g) => g.gradient === gradient) || SESB_GRADIENTS[0];
  linear.addColorStop(0, matched.stops[0]);
  linear.addColorStop(1, matched.stops[1]);
  ctx.fillStyle = linear;
  ctx.fillRect(0, 0, 1080, 1920);

  // Decorative subtle grid circles
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(540, 960, 480, 0, Math.PI * 2);
  ctx.stroke();

  // Header Author / Dept
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(authorName, 540, 280);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '36px sans-serif';
  ctx.fillText(deptName, 540, 340);

  // Main Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 64px sans-serif';
  ctx.textAlign = 'center';

  // Word wrap
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > 900 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const startY = 960 - (lines.length * 80) / 2;
  lines.forEach((line, idx) => {
    ctx.fillText(line, 540, startY + idx * 80);
  });

  // Footer Tagline
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('Sabah Electricity • 24h Story', 540, 1780);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas toBlob failed'));
      }
    }, 'image/jpeg', 0.85);
  });
}

/**
 * Asynchronously inspects video duration using HTML5 video element metadata
 */
export function checkVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Incompatible video format or corrupted file'));
    };
  });
}

/**
 * Extracts a lightweight first-frame thumbnail (JPEG) from a video at 0.5s via hidden canvas
 */
export function captureVideoThumbnail(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.5, Math.max(0.1, video.duration / 4));
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 720;
        canvas.height = video.videoHeight || 1280;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context unavailable'));
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas toBlob failed'));
            return;
          }
          const thumbFile = new File([blob], `thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
          resolve(thumbFile);
        }, 'image/jpeg', 0.82);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to render video thumbnail'));
    };
  });
}
