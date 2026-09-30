import { useRef, useEffect } from 'react';

interface UseHorizontalScrollOptions {
  wheelToHorizontal?: boolean;
}

/**
 * Custom hook that gives horizontal scroll containers fluid mouse click-and-drag panning,
 * mouse-wheel horizontal translation, and click-vs-drag disambiguation.
 */
export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseHorizontalScrollOptions = { wheelToHorizontal: true }
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let hasDragged = false;

    const onWheel = (e: WheelEvent) => {
      if (!options.wheelToHorizontal) return;
      // Convert dominant vertical wheel scroll into horizontal scroll if element can scroll horizontally
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;
      isDown = true;
      hasDragged = false;
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
      el.style.cursor = 'grabbing';
      el.style.userSelect = 'none';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = x - startX;
      if (Math.abs(walk) > 4) {
        hasDragged = true;
      }
      el.scrollLeft = scrollLeft - walk;
    };

    const onMouseUp = () => {
      if (!isDown) return;
      isDown = false;
      el.style.cursor = 'grab';
      el.style.removeProperty('user-select');
      
      if (hasDragged) {
        // Prevent click events on children immediately after dragging
        const captureClick = (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          window.removeEventListener('click', captureClick, true);
        };
        window.addEventListener('click', captureClick, true);
        setTimeout(() => {
          window.removeEventListener('click', captureClick, true);
          hasDragged = false;
        }, 100);
      }
    };

    // Set initial grab cursor for fine pointer devices
    if (window.matchMedia('(pointer: fine)').matches) {
      el.style.cursor = 'grab';
    }

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [options.wheelToHorizontal]);

  return ref;
}
