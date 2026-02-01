import { useCallback } from "react";
import { formatTime } from "../playUtils";

/**
 * Hook to handle downloading the completed puzzle as an image.
 */
export function useDownloadImage(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  elapsedSeconds: number,
  totalPieces: number,
) {
  const downloadImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a new canvas for the share image
    const shareCanvas = document.createElement("canvas");
    const padding = 40;
    const textHeight = 80;
    shareCanvas.width = canvas.width + padding * 2;
    shareCanvas.height = canvas.height + padding * 2 + textHeight;

    const ctx = shareCanvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, shareCanvas.width, shareCanvas.height);

    // Draw the puzzle
    ctx.drawImage(canvas, padding, padding);

    // Add text at bottom
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 32px system-ui, sans-serif";
    ctx.textAlign = "center";

    const timeStr = formatTime(elapsedSeconds);
    ctx.fillText(
      `🧩 Phuzzle - ${totalPieces} pieces in ${timeStr}`,
      shareCanvas.width / 2,
      shareCanvas.height - textHeight / 2 + 10,
    );

    // Download
    const link = document.createElement("a");
    link.download = `phuzzle-${timeStr.replace(":", "m")}s.png`;
    link.href = shareCanvas.toDataURL("image/png");
    link.click();
  }, [canvasRef, elapsedSeconds, totalPieces]);

  return { downloadImage };
}
