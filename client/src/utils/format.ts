/**
 * Format compact metric numbers (e.g. 4.2k, 14.5k, 1.2M)
 */
export function formatCompactNumber(num: number): string {
  if (!num || num < 0) return '0';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toString();
}

/**
 * Human-readable byte formatting (e.g., 4.2 MB, 210 KB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

/**
 * MM:SS video duration formatting (e.g., 0:14, 1:05)
 */
export function formatVideoTime(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
}

