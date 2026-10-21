import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { Area, MediaSize } from 'react-easy-crop';
import styles from './MediaCropModal.module.css';

type HandleType = 'tl' | 'tc' | 'tr' | 'cl' | 'cr' | 'bl' | 'bc' | 'br' | 'inside';

export interface FreeformBoxCropperProps {
  imageSrc: string;
  rotation: number;
  onCropComplete: (cropAreaPixels: Area) => void;
  onMediaLoaded: (size: MediaSize) => void;
}

export const FreeformBoxCropper: React.FC<FreeformBoxCropperProps> = ({
  imageSrc,
  rotation,
  onCropComplete,
  onMediaLoaded,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [displayedRect, setDisplayedRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  const [box, setBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [activeHandle, setActiveHandle] = useState<HandleType | null>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initialBox: { left: number; top: number; width: number; height: number };
  } | null>(null);

  const measureImage = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img || !img.naturalWidth || !img.naturalHeight) return;

    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    setNaturalSize({ width: natW, height: natH });
    onMediaLoaded({ width: natW, height: natH, naturalWidth: natW, naturalHeight: natH });

    const stageRect = stage.getBoundingClientRect();
    const stageW = stageRect.width;
    const stageH = stageRect.height;

    const isSideways = rotation % 180 !== 0;
    const effNatW = isSideways ? natH : natW;
    const effNatH = isSideways ? natW : natH;

    const padding = 20;
    const availW = Math.max(stageW - padding * 2, 50);
    const availH = Math.max(stageH - padding * 2, 50);

    const scale = Math.min(availW / effNatW, availH / effNatH);
    const dispW = Math.round(effNatW * scale);
    const dispH = Math.round(effNatH * scale);
    const dispL = Math.round((stageW - dispW) / 2);
    const dispT = Math.round((stageH - dispH) / 2);

    const rect = { left: dispL, top: dispT, width: dispW, height: dispH };
    setDisplayedRect(rect);
    setBox(rect);
  }, [rotation, onMediaLoaded]);

  useEffect(() => {
    measureImage();
    window.addEventListener('resize', measureImage);
    return () => window.removeEventListener('resize', measureImage);
  }, [measureImage]);

  useEffect(() => {
    if (!box || !displayedRect || !naturalSize) return;

    const isSideways = rotation % 180 !== 0;
    const effNatW = isSideways ? naturalSize.height : naturalSize.width;
    const effNatH = isSideways ? naturalSize.width : naturalSize.height;

    const scale = effNatW / displayedRect.width;

    const rawX = (box.left - displayedRect.left) * scale;
    const rawY = (box.top - displayedRect.top) * scale;
    const rawW = box.width * scale;
    const rawH = box.height * scale;

    const clampedX = Math.max(0, Math.min(rawX, effNatW - 1));
    const clampedY = Math.max(0, Math.min(rawY, effNatH - 1));
    const clampedW = Math.max(1, Math.min(rawW, effNatW - clampedX));
    const clampedH = Math.max(1, Math.min(rawH, effNatH - clampedY));

    onCropComplete({
      x: Math.round(clampedX),
      y: Math.round(clampedY),
      width: Math.round(clampedW),
      height: Math.round(clampedH),
    });
  }, [box, displayedRect, naturalSize, rotation, onCropComplete]);

  const handlePointerDown = (handle: HandleType, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setActiveHandle(handle);
    if (box) {
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialBox: { ...box },
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !dragStartRef.current || !displayedRect) return;

    const { clientX: startX, clientY: startY, initialBox: init } = dragStartRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const minSize = 40;
    let newL = init.left;
    let newT = init.top;
    let newW = init.width;
    let newH = init.height;

    const bounds = {
      minX: displayedRect.left,
      maxX: displayedRect.left + displayedRect.width,
      minY: displayedRect.top,
      maxY: displayedRect.top + displayedRect.height,
    };

    if (activeHandle === 'inside') {
      newL = Math.max(bounds.minX, Math.min(init.left + dx, bounds.maxX - init.width));
      newT = Math.max(bounds.minY, Math.min(init.top + dy, bounds.maxY - init.height));
    } else {
      if (activeHandle === 'tl' || activeHandle === 'cl' || activeHandle === 'bl') {
        const proposedLeft = Math.max(
          bounds.minX,
          Math.min(init.left + dx, init.left + init.width - minSize)
        );
        newW = init.left + init.width - proposedLeft;
        newL = proposedLeft;
      } else if (activeHandle === 'tr' || activeHandle === 'cr' || activeHandle === 'br') {
        const proposedRight = Math.min(
          bounds.maxX,
          Math.max(init.left + minSize, init.left + init.width + dx)
        );
        newW = proposedRight - init.left;
      }

      if (activeHandle === 'tl' || activeHandle === 'tc' || activeHandle === 'tr') {
        const proposedTop = Math.max(
          bounds.minY,
          Math.min(init.top + dy, init.top + init.height - minSize)
        );
        newH = init.top + init.height - proposedTop;
        newT = proposedTop;
      } else if (activeHandle === 'bl' || activeHandle === 'bc' || activeHandle === 'br') {
        const proposedBottom = Math.min(
          bounds.maxY,
          Math.max(init.top + minSize, init.top + init.height + dy)
        );
        newH = proposedBottom - init.top;
      }
    }

    setBox({
      left: Math.round(newL),
      top: Math.round(newT),
      width: Math.round(newW),
      height: Math.round(newH),
    });
  };

  const handlePointerUp = () => {
    setActiveHandle(null);
    dragStartRef.current = null;
  };

  return (
    <div
      ref={stageRef}
      className={styles.freeformStage}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <img
        ref={imgRef}
        src={imageSrc}
        alt=""
        className={styles.freeformStationaryImg}
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
        onLoad={measureImage}
      />

      {displayedRect && box && (
        <>
          <div
            className={styles.freeformMask}
            style={{
              clipPath: `polygon(
                0% 0%, 100% 0%, 100% 100%, 0% 100%,
                0% ${box.top}px,
                ${box.left}px ${box.top}px,
                ${box.left}px ${box.top + box.height}px,
                ${box.left + box.width}px ${box.top + box.height}px,
                ${box.left + box.width}px ${box.top}px,
                0% ${box.top}px
              )`,
            }}
          />

          <div
            className={`${styles.freeformBox} ${activeHandle ? styles.freeformBoxActive : ''}`}
            style={{
              transform: `translate3d(${box.left}px, ${box.top}px, 0)`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
            onPointerDown={(e) => handlePointerDown('inside', e)}
          >
            <div className={styles.gridLineV1} />
            <div className={styles.gridLineV2} />
            <div className={styles.gridLineH1} />
            <div className={styles.gridLineH2} />

            <div
              className={`${styles.dragKnob} ${styles.knobTL}`}
              onPointerDown={(e) => handlePointerDown('tl', e)}
              title="Resize top-left"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobTR}`}
              onPointerDown={(e) => handlePointerDown('tr', e)}
              title="Resize top-right"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobBL}`}
              onPointerDown={(e) => handlePointerDown('bl', e)}
              title="Resize bottom-left"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobBR}`}
              onPointerDown={(e) => handlePointerDown('br', e)}
              title="Resize bottom-right"
            />

            <div
              className={`${styles.dragKnob} ${styles.knobTC}`}
              onPointerDown={(e) => handlePointerDown('tc', e)}
              title="Resize top"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobBC}`}
              onPointerDown={(e) => handlePointerDown('bc', e)}
              title="Resize bottom"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobCL}`}
              onPointerDown={(e) => handlePointerDown('cl', e)}
              title="Resize left"
            />
            <div
              className={`${styles.dragKnob} ${styles.knobCR}`}
              onPointerDown={(e) => handlePointerDown('cr', e)}
              title="Resize right"
            />
          </div>
        </>
      )}
    </div>
  );
};
