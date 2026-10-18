import { useEffect, useRef, useCallback } from 'react';

interface ChoreographyOptions {
  activeTab?: string;
  selectedPostId?: string | null;
}

/**
 * useScrollChoreography
 *
 * Implements a Threads-style sequenced gesture-linked scroll choreography:
 * 1. TopAppBar: Two-phase minimize and dissolve (inner content drifts & fades first, then shell slides out).
 * 2. BottomNav: Bottom bar and center '+' button slide down together below the screen fold (progress 0 -> 0.6).
 * 3. DockedFab: Once the bottom bar clears (progress 0.6 -> 1.0), the mini 48px FAB smoothly rises from
 *    below the bottom-right corner with soft scale and opacity.
 * 4. Reverse scroll: Sinks the right FAB back down before lifting the bottom bar and center '+' button back into full view.
 * 5. Snap-to-rest: Debounced idle spring snaps chrome to fully open or fully closed, preventing half-cut UI states.
 * 6. Direct DOM mutations via rAF: 0 React re-renders during scrolling.
 */
export function useScrollChoreography({ activeTab, selectedPostId }: ChoreographyOptions = {}) {
  const chromeOffsetRef = useRef(0);
  const lastScrollYRef = useRef(0);
  const lastDirectionRef = useRef<'up' | 'down'>('up');
  const downwardAccumulatorRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const snapAnimIdRef = useRef<number | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastAppliedProgressRef = useRef(-1);

  // Cubic bezier approximation (0.16, 1, 0.3, 1) - snappy exponential ease-out
  const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4);

  const getElements = useCallback(() => {
    const topbar = document.querySelector<HTMLElement>('[data-chrome="topbar"]');
    const topbarInner = document.querySelector<HTMLElement>('[data-chrome="topbar-inner"]');
    const bottomnav = document.querySelector<HTMLElement>('[data-chrome="bottomnav"]');
    const dockedFab = document.querySelector<HTMLElement>('[data-chrome="docked-fab"]');
    return { topbar, topbarInner, bottomnav, dockedFab };
  }, []);

  const getMaxDist = useCallback((topbar: HTMLElement | null, bottomnav: HTMLElement | null): number => {
    const bHeight = bottomnav ? bottomnav.offsetHeight : 60;
    const tHeight = topbar ? topbar.offsetHeight : 56;
    return Math.max(bHeight, tHeight, 60);
  }, []);

  // Direct DOM style application
  const applyStyles = useCallback((progress: number) => {
    if (Math.abs(progress - lastAppliedProgressRef.current) < 0.002) {
      return;
    }
    lastAppliedProgressRef.current = progress;

    const { topbar, topbarInner, bottomnav, dockedFab } = getElements();
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. TopAppBar (Two-Phase Minimize & Dissolve)
    if (topbar) {
      if (isReduced) {
        topbar.style.opacity = progress > 0.5 ? '0' : '1';
        topbar.style.transform = progress > 0.5 ? 'translate3d(0, -100%, 0)' : 'translate3d(0, 0, 0)';
      } else {
        if (progress <= 0.5) {
          const p1 = progress / 0.5;
          if (topbarInner) {
            topbarInner.style.opacity = (1 - p1).toFixed(3);
            topbarInner.style.transform = `translate3d(0, ${(-8 * p1).toFixed(1)}px, 0)`;
          }
          topbar.style.transform = `translate3d(0, ${(-30 * p1).toFixed(1)}%, 0)`;
          topbar.style.opacity = '1';
        } else {
          const p2 = (progress - 0.5) / 0.5;
          if (topbarInner) {
            topbarInner.style.opacity = '0';
            topbarInner.style.transform = 'translate3d(0, -8px, 0)';
          }
          topbar.style.transform = `translate3d(0, ${(-30 - 70 * p2).toFixed(1)}%, 0)`;
          topbar.style.opacity = (1 - p2 * 0.4).toFixed(3);
        }
      }
    }

    // 2. BottomNav (Slides down with its center FAB during progress 0 -> 0.6)
    if (bottomnav) {
      if (isReduced) {
        bottomnav.style.transform = progress > 0.5 ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)';
        bottomnav.style.opacity = progress > 0.5 ? '0' : '1';
      } else {
        const pNav = Math.min(1, progress / 0.6);
        bottomnav.style.transform = `translate3d(0, ${(pNav * 100).toFixed(1)}%, 0)`;
        bottomnav.style.opacity = '1';
      }
    }

    // 3. Sequenced Right Docked FAB (Rises from bottom-right as BottomNav completes exit)
    if (dockedFab) {
      if (isReduced) {
        dockedFab.style.opacity = progress > 0.5 ? '1' : '0';
        dockedFab.style.transform = progress > 0.5 ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 80px, 0) scale(0.85)';
        dockedFab.style.pointerEvents = progress > 0.5 ? 'auto' : 'none';
      } else {
        if (progress <= 0.6) {
          // Bottom bar is still visible or exiting: keep right FAB tucked away
          dockedFab.style.transform = 'translate3d(0, 80px, 0) scale(0.85)';
          dockedFab.style.opacity = '0';
          dockedFab.style.pointerEvents = 'none';
        } else {
          // Bottom bar is off-screen: smoothly raise the right docked FAB
          const pFab = (progress - 0.6) / 0.4;
          const currentY = (1 - pFab) * 80; // from 80px to 0px
          const currentScale = 0.85 + (pFab * 0.15); // from 0.85 to 1.0 (48px)

          dockedFab.style.transform = `translate3d(0, ${currentY.toFixed(1)}px, 0) scale(${currentScale.toFixed(3)})`;
          dockedFab.style.opacity = pFab.toFixed(3);
          dockedFab.style.pointerEvents = pFab > 0.5 ? 'auto' : 'none';
        }
      }
    }
  }, [getElements]);

  // Smooth snap animation on gesture end
  const snapTo = useCallback((targetOffset: number, maxDist: number) => {
    if (snapAnimIdRef.current !== null) {
      cancelAnimationFrame(snapAnimIdRef.current);
      snapAnimIdRef.current = null;
    }

    const startOffset = chromeOffsetRef.current;
    const distance = targetOffset - startOffset;
    if (Math.abs(distance) < 1) {
      chromeOffsetRef.current = targetOffset;
      applyStyles(maxDist > 0 ? targetOffset / maxDist : 0);
      return;
    }

    const duration = 220; // 220ms snappy snap
    const startTime = performance.now();

    const animateSnap = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(1, elapsed / duration);
      const eased = easeOutQuart(progressRatio);
      const current = startOffset + distance * eased;

      chromeOffsetRef.current = current;
      applyStyles(maxDist > 0 ? current / maxDist : 0);

      if (progressRatio < 1) {
        snapAnimIdRef.current = requestAnimationFrame(animateSnap);
      } else {
        chromeOffsetRef.current = targetOffset;
        applyStyles(maxDist > 0 ? targetOffset / maxDist : 0);
        snapAnimIdRef.current = null;
      }
    };

    snapAnimIdRef.current = requestAnimationFrame(animateSnap);
  }, [applyStyles]);

  // Hard or animated reset to 100% visible
  const resetChrome = useCallback((animate = true) => {
    if (snapAnimIdRef.current !== null) {
      cancelAnimationFrame(snapAnimIdRef.current);
      snapAnimIdRef.current = null;
    }
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }

    const { topbar, bottomnav } = getElements();
    const maxDist = getMaxDist(topbar, bottomnav);

    downwardAccumulatorRef.current = 0;

    if (animate && chromeOffsetRef.current > 0) {
      snapTo(0, maxDist);
    } else {
      chromeOffsetRef.current = 0;
      lastAppliedProgressRef.current = -1;
      applyStyles(0);
    }
  }, [applyStyles, getElements, getMaxDist, snapTo]);

  // Main scroll loop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Desktop check: disable on >= 1024px
    const isDesktop = () => window.innerWidth >= 1024;
    if (isDesktop()) {
      resetChrome(false);
      return;
    }

    lastScrollYRef.current = Math.max(0, window.scrollY);

    const onScroll = () => {
      if (isDesktop()) return;

      if (snapAnimIdRef.current !== null) {
        cancelAnimationFrame(snapAnimIdRef.current);
        snapAnimIdRef.current = null;
      }

      if (rafIdRef.current !== null) return;

      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;

        const currentY = Math.max(0, window.scrollY);
        const delta = currentY - lastScrollYRef.current;
        lastScrollYRef.current = currentY;

        const { topbar, bottomnav } = getElements();
        const maxDist = getMaxDist(topbar, bottomnav);

        // At the very top (including iOS rubber band), force fully visible
        if (currentY <= 0) {
          chromeOffsetRef.current = 0;
          downwardAccumulatorRef.current = 0;
          applyStyles(0);
          return;
        }

        if (delta > 0) {
          // Scrolling down
          lastDirectionRef.current = 'down';

          // 12px deadzone filter when starting from fully visible
          if (chromeOffsetRef.current === 0) {
            downwardAccumulatorRef.current += delta;
            if (downwardAccumulatorRef.current < 12) {
              return;
            }
          }

          chromeOffsetRef.current = Math.min(maxDist, chromeOffsetRef.current + delta);
        } else if (delta < 0) {
          // Scrolling up - immediate responsive reveal (no deadzone)
          lastDirectionRef.current = 'up';
          downwardAccumulatorRef.current = 0;
          chromeOffsetRef.current = Math.max(0, chromeOffsetRef.current + delta);
        }

        // Invariant: chromeOffset <= currentY
        if (chromeOffsetRef.current > currentY) {
          chromeOffsetRef.current = currentY;
        }

        const progress = maxDist > 0 ? chromeOffsetRef.current / maxDist : 0;
        applyStyles(progress);

        // Debounced Snap-to-Rest when scrolling pauses
        if (idleTimerRef.current !== null) {
          window.clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = window.setTimeout(() => {
          const currentProgress = maxDist > 0 ? chromeOffsetRef.current / maxDist : 0;
          if (currentProgress > 0.05 && currentProgress < 0.95) {
            if (lastDirectionRef.current === 'up') {
              snapTo(0, maxDist);
            } else {
              const target = currentProgress >= 0.4 ? maxDist : 0;
              snapTo(target, maxDist);
            }
          }
        }, 140);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    const onResize = () => {
      if (isDesktop()) {
        resetChrome(false);
      }
    };
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
      if (snapAnimIdRef.current !== null) cancelAnimationFrame(snapAnimIdRef.current);
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [applyStyles, getElements, getMaxDist, resetChrome, snapTo]);

  // Reset chrome on tab switch or navigation change
  useEffect(() => {
    resetChrome(true);
  }, [activeTab, selectedPostId, resetChrome]);

  return { resetChrome };
}
