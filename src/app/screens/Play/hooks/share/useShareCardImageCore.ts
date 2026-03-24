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
const CTA_H = 52;
const FOOTER_H = 40;
const GAP = 16;
const URL_FONT = "400 20px system-ui, -apple-system, sans-serif";

/** Break a long string into lines that fit maxWidth (px). */
function wrapStringToLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let current = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const test = current + ch;
    if (ctx.measureText(test).width > maxWidth && current.length > 0) {
      lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

export function useShareCardImage() {
  const [isGenerating, setIsGenerating] = useState(false);

  const PLAY_BASE = "https://phuzzle.vercel.app";

  const shareCard = useCallback(
    async (args: {
      imageUrl?: string;
      elapsedSeconds: number;
      moveCount: number;
      rotationCount?: number;
      piecesPerMin?: number;
      maxGroupSize?: number;
      accuracyPercent: number;
      percentile: Percentile;
      useSeasonalFrame: boolean;
      puzzleShareUrl?: string;
      pieceCount: number;
      puzzleName?: string;
      /** Challenge = full stats + “Can you beat my time?” + URL on card; result = no CTA. */
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

        // Puzzle image — slightly shorter on challenge cards to fit URL + extra stats
        const imageH = mode === "challenge" ? 680 : IMAGE_H;
        const imgW = panel.w - PAD * 2;
        const imageRect: Rect = { x: panel.x + PAD, y: y, w: imgW, h: imageH };
        fillRoundedRect(ctx, imageRect, 16, "rgba(0,0,0,0.3)");
        drawCoverImage(ctx, img, imageRect, 16);
        strokeRoundedRect(ctx, imageRect, 16, gold, 2);
        y += imageH + GAP;

        // Stats: difficulty, time, moves, rotations (challenge always shows rotations)
        const difficulty = getDifficultyLabel(args.pieceCount);
        const timeStr = formatTime(args.elapsedSeconds);
        const movesStr = String(args.moveCount ?? 0);
        const rotStr = String(args.rotationCount ?? 0);
        const lineHeight = 30;
        ctx.font = "500 24px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#E2E8F0";
        ctx.fillText("Puzzle", panel.x + panel.w / 2, y + lineHeight / 2);
        y += lineHeight + 4;
        ctx.font = "400 22px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#CBD5E1";
        const statsLines =
          mode === "challenge"
            ? [
                `Difficulty: ${difficulty} (${args.pieceCount} pieces)`,
                `Time: ${timeStr}`,
                `Moves: ${movesStr}`,
                `Rotations: ${rotStr}`,
              ]
            : [
                `Difficulty: ${difficulty} (${args.pieceCount} pieces)`,
                `Time: ${timeStr}`,
                `Moves: ${movesStr}`,
                ...(Number(rotStr) > 0 ? [`Rotations: ${rotStr}`] : []),
              ];
        statsLines.forEach((line) => {
          ctx.fillText(line, panel.x + panel.w / 2, y + lineHeight / 2);
          y += lineHeight;
        });
        y += GAP;

        if (mode === "challenge") {
          ctx.font = "600 26px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#F8FAFC";
          ctx.fillText("Can you beat my time?", panel.x + panel.w / 2, y + CTA_H / 2);
          y += CTA_H + 10;

          ctx.font = URL_FONT;
          ctx.fillStyle = "#7DD3FC";
          const urlMaxW = panel.w - PAD * 2;
          const maxUrlLines = 12;
          const allUrlLines = wrapStringToLines(ctx, playUrl, urlMaxW);
          const urlLines = allUrlLines.slice(0, maxUrlLines);
          if (allUrlLines.length > maxUrlLines && urlLines.length > 0) {
            let last = urlLines[urlLines.length - 1];
            const suffix = "…";
            while (last.length > 0 && ctx.measureText(last + suffix).width > urlMaxW) {
              last = last.slice(0, -1);
            }
            urlLines[urlLines.length - 1] = last + suffix;
          }
          const urlLineH = 24;
          urlLines.forEach((line) => {
            ctx.fillText(line, panel.x + panel.w / 2, y + urlLineH / 2);
            y += urlLineH;
          });
          y += 8;
        } else {
          y += 8;
        }

        // Footer: phuzzle.app
        ctx.font = "400 18px system-ui, -apple-system, sans-serif";
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
          rotationCount: args.rotationCount,
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
