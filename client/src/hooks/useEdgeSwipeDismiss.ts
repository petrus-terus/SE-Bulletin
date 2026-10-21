import { useRef } from 'react';

export function useEdgeSwipeDismiss<T extends HTMLElement = HTMLDivElement>(
  onDismiss: () => void,
  edgeThresholdPx: number = 40
) {
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const containerRef = useRef<T | null>(null);

  const handleTouchStart = (e: React.TouchEvent<T>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (touch.clientX < edgeThresholdPx) {
        touchStartXRef.current = touch.clientX;
        touchStartYRef.current = touch.clientY;
        isSwipingRef.current = true;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<T>) => {
    if (!isSwipingRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;

    if (Math.abs(deltaY) > Math.abs(deltaX) && deltaX < 20) {
      isSwipingRef.current = false;
      if (containerRef.current) {
        containerRef.current.style.transform = '';
      }
      return;
    }

    if (deltaX > 0 && containerRef.current) {
      containerRef.current.style.transform = `translate3d(${deltaX}px, 0, 0)`;
      containerRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<T>) => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;

    if (deltaX > 80 && containerRef.current) {
      containerRef.current.style.transition =
        'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease';
      containerRef.current.style.transform = 'translate3d(100%, 0, 0)';
      containerRef.current.style.opacity = '0';
      setTimeout(() => {
        onDismiss();
      }, 180);
    } else if (containerRef.current) {
      containerRef.current.style.transition = 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)';
      containerRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  return {
    containerRef,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
