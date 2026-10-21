import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

/**
 * Headless body scroll lock hook.
 * Locks document.body scroll (overflow = 'hidden') when isLocked is true.
 * Implements reference counting so nested sheets/modals don't prematurely
 * unlock body scroll when an inner modal unmounts.
 *
 * @param isLocked Whether scrolling should be locked (defaults to true)
 */
export function useBodyScrollLock(isLocked: boolean = true): void {
  useEffect(() => {
    if (!isLocked || typeof document === 'undefined') return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        document.body.style.overflow = originalOverflow || '';
      }
    };
  }, [isLocked]);
}
