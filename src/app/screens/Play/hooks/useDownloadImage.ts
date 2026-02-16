/**
 * useDownloadImage – export completed puzzle as PNG with time overlay.
 */
import { useCallback } from "react";
import type React from "react";
import { formatTime } from "../playUtils";

export function useDownloadImage(args: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  state: { totalCount: number } | null;
  elapsedSeconds: number;
}) {
  const { canvasRef, imgRef, state, elapsedSeconds } = args;

  return useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const padding = 40;
    const textHeight = 80;
    const shareCanvas = document.createElement("canvas");
    shareCanvas.width = canvas.width + padding * 2;
    shareCanvas.height = canvas.height + padding * 2 + textHeight;
    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);
    ctx.drawImage(canvas, padding, padding);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `🧩 Phuzzle - ${state?.totalCount ?? 0} pieces in ${formatTime(elapsedSeconds)}`,
      shareCanvas.width / 2,
      shareCanvas.height - textHeight / 2 + 10,
    );

    const link = document.createElement("a");
    link.download = `phuzzle-${formatTime(elapsedSeconds).replace(":", "m")}s.png`;
    link.href = shareCanvas.toDataURL("image/png");
    link.click();
  }, [canvasRef, imgRef, state?.totalCount, elapsedSeconds]);
}
