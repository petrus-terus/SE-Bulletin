import type { SyntheticEvent } from 'react';
import {
  DEFAULT_AVATAR_URL,
  DEFAULT_LOGO_URL,
  SESB_LOGO_FALLBACK_URL,
  DEFAULT_APP_ICON_URL,
  FAVICON_URL,
  DEFAULT_COVER_URL,
  FALLBACK_POST_IMAGE_URL,
} from '@/constants/bulletin';

export {
  DEFAULT_AVATAR_URL,
  DEFAULT_LOGO_URL,
  SESB_LOGO_FALLBACK_URL,
  DEFAULT_APP_ICON_URL,
  FAVICON_URL,
  DEFAULT_COVER_URL,
  FALLBACK_POST_IMAGE_URL,
};

/**
 * Null-safe image error fallback helper preventing broken image icons
 * and infinite error loops if fallback asset is missing.
 */
export function handleAvatarError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = DEFAULT_AVATAR_URL
): void {
  const target = event.currentTarget as HTMLImageElement;
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}

export function handleLogoError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = DEFAULT_LOGO_URL
): void {
  const target = event.currentTarget as HTMLImageElement;
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}

export function handleCoverError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = DEFAULT_COVER_URL
): void {
  const target = event.currentTarget as HTMLImageElement;
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}

export function handlePostImageError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FALLBACK_POST_IMAGE_URL
): void {
  const target = event.currentTarget as HTMLImageElement;
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}

export function handleAppIconError(
  event: SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FAVICON_URL
): void {
  const target = event.currentTarget as HTMLImageElement;
  if (target.src !== fallback && !target.src.endsWith(fallback)) {
    target.src = fallback;
  }
}
