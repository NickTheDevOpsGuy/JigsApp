/**
 * useShareCardImage - generate/share completion card PNG.
 * Card layout: Phuzzle branding, puzzle image (largest), stats, CTA, phuzzle.app.
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
import { getDifficultyLabel } from "@/screens/Play/core/share/shareMessages";
import { formatTime } from "@/screens/Play/core/utils/playUtils";
import { canvasToBlob, yieldToMainThread } from "@/utils/async";

type Percentile = { topPercent: number; totalPlayers: number } | null;

const CARD_W = 1080;
const CARD_H = 1520;
const MARGIN = 48;
const CARD_RADIUS = 24;
const PAD = 40;
const HEADER_H = 56;
const IMAGE_H = 800;
const CTA_H = 48;
const FOOTER_H = 44;
const GAP = 16;

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
      puzzleName?: string;
      /** Challenge = “Think you can beat me?” CTA; result = same stats, no CTA. */
      mode?: "challenge" | "result";
    }) => {
      if (!args.imageUrl || isGenerating) return;
      setIsGenerating(true);
      const mode = args.mode ?? "result";
      try {
        await yieldToMainThread();
        const playPath = args.puzzleShareUrl ?? "/";
        let playUrl = playPath.startsWith("http")
          ? playPath
          : `${PLAY_BASE}${playPath.startsWith("/") ? playPath : `/${playPath}`}`;
        if (mode === "challenge") {
          const sep = playUrl.includes("?") ? "&" : "?";
          playUrl = `${playUrl}${sep}ct=${args.elapsedSeconds}&cm=${args.moveCount ?? 0}`;
        }

        const img = await loadImage(args.imageUrl);
        await yieldToMainThread();
        const scale = 2;
        const canvas = document.createElement("canvas");
        canvas.width = CARD_W * scale;
        canvas.height = CARD_H * scale;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.scale(scale, scale);

        const gold = "#D4AF37";
        const cardW = CARD_W - MARGIN * 2;
        const cardH = CARD_H - MARGIN * 2;
        const panel: Rect = { x: MARGIN, y: MARGIN, w: cardW, h: cardH };

        drawOgStyleCardBackground(ctx, panel, CARD_RADIUS);
        strokeRoundedRect(ctx, panel, CARD_RADIUS, "rgba(255,255,255,0.12)", 1);

        let y = panel.y + PAD;

        // Header: Phuzzle
        ctx.font = "600 32px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#F8FAFC";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Phuzzle", panel.x + panel.w / 2, y + HEADER_H / 2);
        y += HEADER_H + GAP;

        // Puzzle image (largest element)
        const imgW = panel.w - PAD * 2;
        const imageRect: Rect = { x: panel.x + PAD, y: y, w: imgW, h: IMAGE_H };
        fillRoundedRect(ctx, imageRect, 16, "rgba(0,0,0,0.3)");
        drawCoverImage(ctx, img, imageRect, 16);
        strokeRoundedRect(ctx, imageRect, 16, gold, 2);
        y += IMAGE_H + GAP;

        // Stats: match link-preview card — “Puzzle” label, difficulty, time, moves (no taunts on result)
        const difficulty = getDifficultyLabel(args.pieceCount);
        const timeStr = formatTime(args.elapsedSeconds);
        const movesStr = String(args.moveCount ?? 0);
        const lineHeight = 32;
        ctx.font = "500 24px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#E2E8F0";
        ctx.fillText("Puzzle", panel.x + panel.w / 2, y + lineHeight / 2);
        y += lineHeight + 4;
        ctx.font = "400 22px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#CBD5E1";
        const statsLines = [
          `Difficulty: ${difficulty} (${args.pieceCount} pieces)`,
          `Time: ${timeStr}`,
          `Moves: ${movesStr}`,
        ];
        statsLines.forEach((line) => {
          ctx.fillText(line, panel.x + panel.w / 2, y + lineHeight / 2);
          y += lineHeight;
        });
        y += GAP;

        if (mode === "challenge") {
          ctx.font = "600 26px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#F8FAFC";
          ctx.fillText("Think you can beat me?", panel.x + panel.w / 2, y + CTA_H / 2);
          y += CTA_H + 8;
        } else {
          y += 8;
        }

        // Footer: phuzzle.app
        ctx.font = "400 20px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#94A3B8";
        ctx.fillText("phuzzle.app", panel.x + panel.w / 2, y + FOOTER_H / 2);

        const outCanvas = document.createElement("canvas");
        outCanvas.width = CARD_W;
        outCanvas.height = CARD_H;
        const outCtx = outCanvas.getContext("2d");
        if (outCtx) {
          outCtx.imageSmoothingEnabled = true;
          if ("imageSmoothingQuality" in outCtx) {
            (
              outCtx as CanvasRenderingContext2D & { imageSmoothingQuality: string }
            ).imageSmoothingQuality = "high";
          }
          outCtx.drawImage(
            canvas,
            0,
            0,
            CARD_W * scale,
            CARD_H * scale,
            0,
            0,
            CARD_W,
            CARD_H,
          );
        }
        await yieldToMainThread();
        const blob = await canvasToBlob(outCtx ? outCanvas : canvas, "image/png");
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
          puzzleName: args.puzzleName,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating],
  );

  return { shareCard, isGenerating };
}
