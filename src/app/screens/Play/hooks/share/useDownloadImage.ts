/**
 * useDownloadImage – export completed puzzle as PNG with time overlay.
 */
import { useCallback } from "react";
import type React from "react";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { canvasToBlob, yieldToMainThread } from "@/utils/async";

export function useDownloadImage(args: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imgRef: React.RefObject<HTMLImageElement | null>;
  state: { totalCount: number } | null;
  elapsedSeconds: number;
}) {
  const { canvasRef, imgRef, state, elapsedSeconds } = args;

  return useCallback(async () => {
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

    await yieldToMainThread();
    const blob = await canvasToBlob(shareCanvas, "image/png");
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `phuzzle-${formatTime(elapsedSeconds).replace(":", "m")}s.png`;
    link.href = url;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [canvasRef, imgRef, state?.totalCount, elapsedSeconds]);
}
