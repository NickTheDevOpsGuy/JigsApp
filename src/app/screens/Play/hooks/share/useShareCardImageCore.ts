/**
 * useShareCardImage - generate/share completion card PNG.
 */
import { useCallback, useState } from "react";
import {
  drawCoverImage,
  drawOgStyleCardBackground,
  fillRoundedRect,
  type Rect,
  strokeRoundedRect,
} from "@/screens/Play/hooks/share/shareCardImageHelpers";
import { loadImage } from "@/screens/Play/hooks/share/shareCardImageUtils";
import { shareOrDownloadCard } from "@/screens/Play/hooks/share/shareCardImageShare";

type Percentile = { topPercent: number; totalPlayers: number } | null;

export function useShareCardImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const PLAY_BASE = "https://phuzzle.vercel.app";

  const shareCard = useCallback(
    async (args: {
      imageUrl?: string;
      elapsedSeconds: number;
      moveCount: number;
      piecesPerMin?: number;
      maxGroupSize?: number;
      accuracyPercent: number;
      percentile: Percentile;
      useSeasonalFrame: boolean;
      puzzleShareUrl?: string;
      pieceCount: number;
      /** Challenge = taunt copy ("Think you can beat me?", "Same puzzle, same difficulty:"). Result = informational only. */
      mode?: "challenge" | "result";
    }) => {
      if (!args.imageUrl || isGenerating) return;
      setIsGenerating(true);
      const mode = args.mode ?? "result";
      try {
        const playPath = args.puzzleShareUrl ?? "/";
        const playUrl = playPath.startsWith("http")
          ? playPath
          : `${PLAY_BASE}${playPath.startsWith("/") ? playPath : `/${playPath}`}`;

        const img = await loadImage(args.imageUrl);
        const scale = 2;
        const outW = 1080;
        const outH = 1520;
        const canvas = document.createElement("canvas");
        canvas.width = outW * scale;
        canvas.height = outH * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(scale, scale);

        const gold = "#D4AF37";
        const cardRadius = 24;
        const margin = 48;
        const cardW = outW - margin * 2;
        const cardH = outH - margin * 2;
        const panel: Rect = { x: margin, y: margin, w: cardW, h: cardH };
        const pad = 48;

        drawOgStyleCardBackground(ctx, panel, cardRadius);
        strokeRoundedRect(ctx, panel, cardRadius, "rgba(255,255,255,0.12)", 1);

        const imgSize = Math.min(panel.w - pad * 2, panel.h - pad * 2);
        const imgX = panel.x + (panel.w - imgSize) / 2;
        const imgY = panel.y + (panel.h - imgSize) / 2;
        const imageRect: Rect = { x: imgX, y: imgY, w: imgSize, h: imgSize };
        fillRoundedRect(ctx, imageRect, 16, "rgba(0,0,0,0.3)");
        drawCoverImage(ctx, img, imageRect, 16);
        strokeRoundedRect(ctx, imageRect, 16, gold, 2);

        const outCanvas = document.createElement("canvas");
        outCanvas.width = outW;
        outCanvas.height = outH;
        const outCtx = outCanvas.getContext("2d");
        if (outCtx) {
          outCtx.imageSmoothingEnabled = true;
          if ("imageSmoothingQuality" in outCtx) {
            (
              outCtx as CanvasRenderingContext2D & { imageSmoothingQuality: string }
            ).imageSmoothingQuality = "high";
          }
          outCtx.drawImage(canvas, 0, 0, outW * scale, outH * scale, 0, 0, outW, outH);
        }
        const blob = await new Promise<Blob | null>((resolve) =>
          (outCtx ? outCanvas : canvas).toBlob(resolve, "image/png"),
        );
        if (!blob) return;
        await shareOrDownloadCard({
          blob,
          mode,
          elapsedSeconds: args.elapsedSeconds,
          pieceCount: args.pieceCount,
          accuracyPercent: args.accuracyPercent,
          playUrl,
          moveCount: args.moveCount,
          maxGroupSize: args.maxGroupSize,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating],
  );

  return { shareCard, isGenerating };
}
