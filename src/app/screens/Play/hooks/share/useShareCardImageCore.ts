/**
 * useShareCardImage - generate/share completion card PNG.
 * Card layout: iMessage-style dark card, square puzzle image, large stats, optional challenge CTA, URL + site footer.
 */
import { useCallback, useState } from "react";
import {
  drawCoverImage,
  drawMessagingShareCardBackground,
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
const GAP = 18;
const URL_FONT = "400 22px system-ui, -apple-system, sans-serif";

function shareFooterHost(playUrl: string): string {
  try {
    const u = new URL(playUrl);
    return u.host || "phuzzle.vercel.app";
  } catch {
    return "phuzzle.vercel.app";
  }
}

/** Break a long string into lines that fit maxWidth (px). */
function wrapStringToLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
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
      /** Reserved for future card frames; ignored for iMessage-style layout. */
      useSeasonalFrame: boolean;
      puzzleShareUrl?: string;
      pieceCount: number;
      puzzleName?: string;
      /** Challenge = stats + “Think you can beat me?” + URL; result = same card without CTA. */
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

        const cardW = CARD_W - MARGIN * 2;
        const cardH = CARD_H - MARGIN * 2;
        const panel: Rect = { x: MARGIN, y: MARGIN, w: cardW, h: cardH };

        drawMessagingShareCardBackground(ctx, panel, CARD_RADIUS);
        strokeRoundedRect(ctx, panel, CARD_RADIUS, "rgba(255,255,255,0.1)", 1);

        let y = panel.y + PAD;

        ctx.font = "600 36px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#FAFAFA";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Phuzzle", panel.x + panel.w / 2, y + 22);
        y += 52 + GAP;

        const contentW = panel.w - PAD * 2;
        const rotN = args.rotationCount ?? 0;
        const showRot = rotN > 0;
        const statsBodyLines = showRot ? 4 : 3;
        const ctaBlock = mode === "challenge" ? 44 + GAP : 0;
        const urlBlockEst = 110;
        const footerBlock = 36;
        const statsHeadH = 36;
        const statsBodyH = statsBodyLines * 34 + GAP;
        const belowImage =
          GAP + statsHeadH + statsBodyH + ctaBlock + urlBlockEst + footerBlock + 8;

        const maxSquare = panel.y + panel.h - PAD - y - belowImage;
        const imageSide = Math.max(240, Math.min(contentW, Math.max(240, maxSquare)));
        const imgX = panel.x + (panel.w - imageSide) / 2;
        const imageRect: Rect = { x: imgX, y, w: imageSide, h: imageSide };
        fillRoundedRect(ctx, imageRect, 18, "rgba(0,0,0,0.35)");
        drawCoverImage(ctx, img, imageRect, 18);
        strokeRoundedRect(ctx, imageRect, 18, "rgba(255,255,255,0.14)", 2);
        y += imageSide + GAP;

        const difficulty = getDifficultyLabel(args.pieceCount);
        const timeStr = formatTime(args.elapsedSeconds);
        const movesStr = String(args.moveCount ?? 0);

        const lineH = 34;
        ctx.font = "600 30px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#F5F5F5";
        ctx.fillText("Puzzle", panel.x + panel.w / 2, y + lineH / 2);
        y += lineH + 6;

        ctx.font = "500 28px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#D4D4D4";
        const statLines = [
          `Difficulty: ${difficulty} (${args.pieceCount} pieces)`,
          `Time: ${timeStr}`,
          `Moves: ${movesStr}`,
          ...(showRot ? [`Rotations: ${rotN}`] : []),
        ];
        statLines.forEach((line) => {
          ctx.fillText(line, panel.x + panel.w / 2, y + lineH / 2);
          y += lineH;
        });
        y += GAP;

        if (mode === "challenge") {
          ctx.font = "600 30px system-ui, -apple-system, sans-serif";
          ctx.fillStyle = "#FAFAFA";
          ctx.fillText("Think you can beat me?", panel.x + panel.w / 2, y + 22);
          y += 44 + GAP;
        }

        ctx.font = URL_FONT;
        ctx.fillStyle = "#A3A3A3";
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
        const urlLineH = 26;
        urlLines.forEach((line) => {
          ctx.fillText(line, panel.x + panel.w / 2, y + urlLineH / 2);
          y += urlLineH;
        });
        y += 10;

        ctx.font = "400 20px system-ui, -apple-system, sans-serif";
        ctx.fillStyle = "#737373";
        ctx.fillText(shareFooterHost(playUrl), panel.x + panel.w / 2, y + 16);

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
