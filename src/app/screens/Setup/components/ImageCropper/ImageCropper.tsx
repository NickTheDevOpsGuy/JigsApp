/**
 * ImageCropper – zoom, pan, and crop an image with aspect ratio lock and grid preview.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ImageCropper.module.css";

export type CropResult = {
  dataUrl: string;
  width: number;
  height: number;
};

type ImageCropperProps = {
  src: string;
  rows: number;
  cols: number;
  onCrop: (result: CropResult) => void;
  onCancel: () => void;
};

export function ImageCropper({ src, rows, cols, onCrop, onCancel }: ImageCropperProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 320, h: 240 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  const _aspectRatio = cols / rows;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setScale(1);
      setOffset({ x: 0, y: 0 });
    };
    img.src = src;
  }, [src]);

  const updateViewportSize = useCallback(() => {
    if (viewportRef.current) {
      const rect = viewportRef.current.getBoundingClientRect();
      setViewportSize({ w: rect.width, h: rect.height });
    }
  }, []);

  useEffect(() => {
    const ro = new ResizeObserver(updateViewportSize);
    const el = viewportRef.current;
    if (el) {
      updateViewportSize();
      ro.observe(el);
    }
    return () => ro.disconnect();
  }, [updateViewportSize]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale((s) => Math.max(0.5, Math.min(3, s + delta)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      setOffset({
        x: dragStartRef.current.offsetX + e.clientX - dragStartRef.current.x,
        y: dragStartRef.current.offsetY + e.clientY - dragStartRef.current.y,
      });
    },
    [isDragging],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  const handleCrop = () => {
    const img = new Image();
    img.onload = () => {
      const vpW = viewportSize.w;
      const vpH = viewportSize.h;
      const srcW = vpW / scale;
      const srcH = vpH / scale;
      const srcX = img.naturalWidth / 2 - vpW / (2 * scale) - offset.x / scale;
      const srcY = img.naturalHeight / 2 - vpH / (2 * scale) - offset.y / scale;

      const outW = Math.max(1, Math.round(cols * 80));
      const outH = Math.max(1, Math.round(outW * (rows / cols)));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const sx = Math.max(0, srcX);
      const sy = Math.max(0, srcY);
      const sw = Math.min(srcW, img.naturalWidth - sx);
      const sh = Math.min(srcH, img.naturalHeight - sy);

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const dataUrl = canvas.toDataURL("image/png");
      onCrop({ dataUrl, width: outW, height: outH });
    };
    img.src = src;
  };

  if (imgSize.w === 0) {
    return (
      <div className={styles.cropper}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.cropperWrap}>
      <p className={styles.hint}>
        Drag to pan • Scroll to zoom • Aspect ratio locked to grid
      </p>
      <div
        className={styles.cropper}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        style={{ touchAction: "none" }}
      >
        <div
          ref={viewportRef}
          className={styles.cropViewport}
          style={{
            aspectRatio: `${cols} / ${rows}`,
          }}
        >
          <div
            className={styles.cropImageWrap}
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          >
            <img
              src={src}
              alt="Crop"
              className={styles.cropImage}
              draggable={false}
              style={{
                width: imgSize.w,
                height: imgSize.h,
                display: "block",
              }}
            />
          </div>
          <div
            className={styles.gridOverlay}
            style={{
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gridTemplateRows: `repeat(${rows}, 1fr)`,
            }}
          />
        </div>
      </div>
      <div className={styles.cropActions}>
        <button type="button" className={styles.cropBtn} onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className={styles.cropBtnPrimary} onClick={handleCrop}>
          Apply crop
        </button>
      </div>
    </div>
  );
}
