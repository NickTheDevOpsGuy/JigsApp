/**
 * useShareCardImage - generate/share completion card PNG.
 */
import { useCallback, useState } from "react";
import { getCurrentSeason } from "@/utils/seasons";
import { formatTime } from "../playUtils";

type Percentile = { topPercent: number; totalPlayers: number } | null;

function getRankFromPercentile(percentile: Percentile): string {
  if (!percentile || percentile.totalPlayers < 2) return "Unranked";
  const ratio = Math.max(0, Math.min(1, percentile.topPercent / 100));
  const rank = Math.max(
    1,
    percentile.totalPlayers - Math.round(ratio * percentile.totalPlayers) + 1,
  );
  return `#${rank}/${percentile.totalPlayers}`;
}

function getSeasonPalette() {
  const season = getCurrentSeason();
  if (season === "spring") {
    return { bg1: "#1f4a3d", bg2: "#3b8f6b", frame: "#8fd19e", accent: "#dfffe7" };
  }
  if (season === "summer") {
    return { bg1: "#0f3b66", bg2: "#1f7ab3", frame: "#7fd5ff", accent: "#dbf4ff" };
  }
  if (season === "fall") {
    return { bg1: "#4a2b17", bg2: "#8a4b27", frame: "#f2b26b", accent: "#ffe7cd" };
  }
  return { bg1: "#1d2540", bg2: "#45517d", frame: "#cfd8ff", accent: "#eef2ff" };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

export function useShareCardImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const PLAY_BASE = "https://phuzzle.vercel.app";

  const shareCard = useCallback(
    async (args: {
      imageUrl?: string;
      elapsedSeconds: number;
      moveCount: number;
      accuracyPercent: number;
      percentile: Percentile;
      useSeasonalFrame: boolean;
      puzzleShareUrl?: string;
    }) => {
      if (!args.imageUrl || isGenerating) return;
      setIsGenerating(true);
      try {
        const playPath = args.puzzleShareUrl ?? "/";
        const playUrl = playPath.startsWith("http")
          ? playPath
          : `${PLAY_BASE}${playPath.startsWith("/") ? playPath : `/${playPath}`}`;

        const img = await loadImage(args.imageUrl);
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const palette = args.useSeasonalFrame
          ? getSeasonPalette()
          : { bg1: "#141723", bg2: "#2a2f45", frame: "#8f9bc7", accent: "#f3f5ff" };

        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, palette.bg1);
        grad.addColorStop(1, palette.bg2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(60, 60, canvas.width - 120, canvas.height - 120);
        ctx.strokeStyle = palette.frame;
        ctx.lineWidth = 8;
        ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

        const imageBox = { x: 110, y: 170, w: 860, h: 860 };
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(imageBox.x, imageBox.y, imageBox.w, imageBox.h);
        // Scale image to fit within box, centered (object-fit: contain)
        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;
        const scale = Math.min(imageBox.w / imgW, imageBox.h / imgH);
        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = imageBox.x + (imageBox.w - drawW) / 2;
        const drawY = imageBox.y + (imageBox.h - drawH) / 2;
        ctx.drawImage(img, drawX, drawY, drawW, drawH);

        ctx.fillStyle = palette.accent;
        ctx.textAlign = "center";
        ctx.font = "700 46px system-ui, sans-serif";
        ctx.fillText("Phuzzle Completion Card", canvas.width / 2, 120);

        const rankLabel = getRankFromPercentile(args.percentile);
        const percentileLabel =
          args.percentile && args.percentile.totalPlayers >= 5
            ? `Top ${args.percentile.topPercent}%`
            : "Top --";
        const stats = [
          `Time ${formatTime(args.elapsedSeconds)}`,
          `Moves ${Math.max(args.moveCount, 0)}`,
          `Accuracy ${Math.max(0, Math.min(100, args.accuracyPercent))}%`,
          `Rank ${rankLabel} (${percentileLabel})`,
        ];
        ctx.font = "600 34px system-ui, sans-serif";
        stats.forEach((line, i) => {
          ctx.fillText(line, canvas.width / 2, 1100 + i * 56);
        });

        // No URL or link text on the image – link is only in the share message so it’s clickable for recipients.

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) return;
        const file = new File([blob], "phuzzle-completion-card.png", {
          type: "image/png",
        });

        const mins = Math.floor(args.elapsedSeconds / 60);
        const minuteWord = mins === 1 ? "minute" : "minutes";
        const shareText = `I beat this in ${mins} ${minuteWord}! How well can you do? Play the game here\n\n${playUrl}`;
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: "My Phuzzle completion",
            text: shareText,
            files: [file],
          });
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "phuzzle-completion-card.png";
        link.click();
        URL.revokeObjectURL(url);
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating],
  );

  return { shareCard, isGenerating };
}
