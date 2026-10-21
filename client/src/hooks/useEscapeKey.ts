import { useEffect, useRef } from 'react';

/**
 * Headless keyboard hook listening for 'Escape' key presses.
 * Uses a ref-stabilized callback so handler updates don't cause
 * unnecessary re-subscription of window listeners.
 *
 * @param onEscape Callback fired when Escape is pressed
 * @param isActive Whether the listener should be active (defaults to true)
 */
export function useEscapeKey(onEscape: () => void, isActive: boolean = true): void {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscapeRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);
}
