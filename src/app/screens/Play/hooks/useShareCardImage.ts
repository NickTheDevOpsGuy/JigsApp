/**
 * useShareCardImage - generate/share completion card PNG.
 */
import { useCallback, useState } from "react";
import { getCurrentSeason } from "@/utils/seasons";
import { formatTime } from "../playUtils";
import { buildProgressShareMessage, buildChallengeShareMessage } from "../shareMessages";

type Percentile = { topPercent: number; totalPlayers: number } | null;
type Rect = { x: number; y: number; w: number; h: number };

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getDifficultyLabel(pieceCount: number): string {
  if (pieceCount <= 9) return "Easy";
  if (pieceCount <= 16) return "Medium";
  if (pieceCount <= 25) return "Hard";
  if (pieceCount <= 36) return "Expert";
  if (pieceCount <= 49) return "Master";
  if (pieceCount <= 64) return "Legend";
  return "Extreme";
}

function _getPiecesLine(pieceCount: number): string {
  if (pieceCount <= 0) return "Custom Puzzle";
  return `${pieceCount} Pieces • ${getDifficultyLabel(pieceCount)}`;
}

function _getSeasonPalette() {
  const season = getCurrentSeason();
  if (season === "spring") {
    return {
      bg1: "#15392f",
      bg2: "#3b8f6b",
      frame: "#93e3ae",
      accent: "#e8fff0",
      panel: "rgba(10, 26, 20, 0.74)",
      chip: "rgba(147, 227, 174, 0.16)",
    };
  }
  if (season === "summer") {
    return {
      bg1: "#0b2a4d",
      bg2: "#1f7ab3",
      frame: "#8dd9ff",
      accent: "#e4f7ff",
      panel: "rgba(9, 20, 38, 0.75)",
      chip: "rgba(141, 217, 255, 0.18)",
    };
  }
  if (season === "fall") {
    return {
      bg1: "#3f2414",
      bg2: "#8a4b27",
      frame: "#f4bf7f",
      accent: "#fff0dc",
      panel: "rgba(36, 21, 13, 0.76)",
      chip: "rgba(244, 191, 127, 0.18)",
    };
  }
  return {
    bg1: "#1d2540",
    bg2: "#45517d",
    frame: "#cfd8ff",
    accent: "#eef2ff",
    panel: "rgba(15, 20, 35, 0.76)",
    chip: "rgba(207, 216, 255, 0.17)",
  };
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

function roundedRectPath(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  const r = Math.max(0, Math.min(radius, rect.w / 2, rect.h / 2));
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.w - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
  ctx.quadraticCurveTo(
    rect.x + rect.w,
    rect.y + rect.h,
    rect.x + rect.w - r,
    rect.y + rect.h,
  );
  ctx.lineTo(rect.x + r, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  fillStyle: string,
) {
  roundedRectPath(ctx, rect, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  radius: number,
  strokeStyle: string,
  lineWidth = 1,
) {
  roundedRectPath(ctx, rect, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  rect: Rect,
  radius: number,
) {
  ctx.save();
  roundedRectPath(ctx, rect, radius);
  ctx.clip();

  const imgW = Math.max(1, img.naturalWidth);
  const imgH = Math.max(1, img.naturalHeight);
  const scale = Math.max(rect.w / imgW, rect.h / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const drawX = rect.x + (rect.w - drawW) / 2;
  const drawY = rect.y + (rect.h - drawH) / 2;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

/** Seeded scatter for star positions (no grid/diagonal lines). */
function scatter(seed: number, index: number): number {
  const t = (index * 2654435761 + seed) >>> 0;
  return (t % 10007) / 10007;
}

/** Dark card background like reference: gradient + subtle white speckles (starry). */
function drawCardBackground(ctx: CanvasRenderingContext2D, rect: Rect, radius: number) {
  const bg1 = "#0a0e1a";
  const bg2 = "#1a1f35";
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, bg1);
  g.addColorStop(1, bg2);
  ctx.fillStyle = g;
  roundedRectPath(ctx, rect, radius);
  ctx.fill();
  const pad = 16;
  const innerW = Math.max(0, rect.w - pad * 2);
  const innerH = Math.max(0, rect.h - pad * 2);
  const count = Math.floor((innerW / 48) * (innerH / 48));
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < count; i++) {
    const x = rect.x + pad + scatter(1, i) * innerW;
    const y = rect.y + pad + scatter(2, i) * innerH;
    ctx.beginPath();
    ctx.arc(x, y, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw a simple puzzle-piece icon (multi-color segments). */
function drawPuzzleIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
) {
  const w = size;
  const h = size * 1.05;
  const r = size * 0.18;
  ctx.save();
  ctx.translate(x, y);
  const colors = ["#facc15", "#3b82f6", "#22c55e", "#f97316"];
  fillRoundedRect(ctx, { x: 0, y: 0, w, h }, r, colors[0]);
  strokeRoundedRect(ctx, { x: 0, y: 0, w, h }, r, "rgba(255,255,255,0.35)", 1);
  const tabW = w * 0.3;
  const tabH = h * 0.2;
  fillRoundedRect(
    ctx,
    { x: w * 0.35, y: -tabH * 0.2, w: tabW, h: tabH * 1.2 },
    r * 0.5,
    colors[1],
  );
  fillRoundedRect(
    ctx,
    { x: w - tabW * 0.85, y: h * 0.38, w: tabW * 1.05, h: tabH },
    r * 0.5,
    colors[2],
  );
  fillRoundedRect(
    ctx,
    { x: w * 0.34, y: h - tabH * 0.6, w: tabW, h: tabH * 1.05 },
    r * 0.5,
    colors[3],
  );
  ctx.restore();
}

function _drawChipRow(
  ctx: CanvasRenderingContext2D,
  rowBounds: Rect,
  labels: string[],
  chipFill: string,
  textFill: string,
) {
  if (labels.length === 0) return;
  const gap = 14;
  const chipHeight = 58;
  const widths = labels.map((label) => Math.ceil(ctx.measureText(label).width) + 44);
  const totalWidth =
    widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1);
  let x = rowBounds.x + (rowBounds.w - totalWidth) / 2;
  const y = rowBounds.y + (rowBounds.h - chipHeight) / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  labels.forEach((label, index) => {
    const rect = { x, y, w: widths[index], h: chipHeight };
    fillRoundedRect(ctx, rect, 28, chipFill);
    strokeRoundedRect(ctx, rect, 28, "rgba(255,255,255,0.16)");
    ctx.fillStyle = textFill;
    ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
    x += rect.w + gap;
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
      pieceCount: number;
      /** Challenge = taunt copy ("Think you're faster?", "Try the same puzzle:"). Result = informational only. */
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
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1520;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const gold = "#D4AF37";
        const white = "#ffffff";
        const blueBtn = "#2563eb";
        const cardRadius = 24;
        const margin = 48;
        const cardW = canvas.width - margin * 2;
        const cardH = canvas.height - margin * 2;
        const panel: Rect = { x: margin, y: margin, w: cardW, h: cardH };
        const centerX = panel.x + panel.w / 2;

        drawCardBackground(ctx, panel, cardRadius);
        strokeRoundedRect(ctx, panel, cardRadius, "rgba(255,255,255,0.12)", 1);

        /* Header like reference: icon + "PUZZLE CHALLENGE -" / "PHUZZLE RESULT" */
        const headerY = panel.y + 44;
        const iconSize = 44;
        const headerGap = 14;
        drawPuzzleIcon(ctx, panel.x + 32, headerY - iconSize / 2, iconSize);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = white;
        ctx.font = "700 28px system-ui, sans-serif";
        const headerText = mode === "challenge" ? "PUZZLE CHALLENGE -" : "PHUZZLE RESULT";
        ctx.fillText(headerText, panel.x + 32 + iconSize + headerGap, headerY);

        /* Puzzle image directly under header (like reference) */
        const line1Y = headerY + 28;
        ctx.strokeStyle = gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(panel.x + 32, line1Y);
        ctx.lineTo(panel.x + panel.w - 32, line1Y);
        ctx.stroke();

        const imgSize = Math.min(panel.w - 64, 560);
        const imgX = panel.x + (panel.w - imgSize) / 2;
        const imgY = line1Y + 24;
        const imageRect: Rect = { x: imgX, y: imgY, w: imgSize, h: imgSize };
        fillRoundedRect(ctx, imageRect, 12, "#0f172a");
        drawCoverImage(ctx, img, imageRect, 12);
        strokeRoundedRect(ctx, imageRect, 12, gold, 2);

        /* Gold line then centered stats below image (like reference) */
        const line2Y = imgY + imgSize + 20;
        ctx.strokeStyle = gold;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(panel.x + 32, line2Y);
        ctx.lineTo(panel.x + panel.w - 32, line2Y);
        ctx.stroke();

        const pieceLineShort =
          args.pieceCount <= 0
            ? "Custom Puzzle"
            : `${args.pieceCount} Pieces • ${getDifficultyLabel(args.pieceCount)}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = white;
        ctx.font = "700 38px system-ui, sans-serif";
        const timeLabel = mode === "challenge" ? "My Time" : "Time";
        ctx.fillText(
          `${timeLabel}: ${formatTime(args.elapsedSeconds)}`,
          centerX,
          line2Y + 48,
        );
        ctx.font = "600 26px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillText(pieceLineShort, centerX, line2Y + 88);
        if (mode === "result") {
          const accuracy = clampPercent(args.accuracyPercent);
          ctx.font = "500 22px system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.88)";
          ctx.fillText(`Accuracy: ${accuracy}%`, centerX, line2Y + 126);
        }

        const sectionY = line2Y + (mode === "result" ? 158 : 120);
        const icon2Size = 36;
        const footerGap = 12;
        drawPuzzleIcon(ctx, panel.x + 32, sectionY - icon2Size / 2 + 10, icon2Size);
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillStyle = white;
        ctx.font = "700 22px system-ui, sans-serif";
        ctx.fillText(
          mode === "challenge" ? "PUZZLE CHALLENGE" : "PHUZZLE",
          panel.x + 32 + icon2Size + footerGap,
          sectionY,
        );

        const ctaY = sectionY + 44;
        if (mode === "challenge") {
          ctx.textAlign = "center";
          ctx.fillStyle = white;
          ctx.font = "600 26px system-ui, sans-serif";
          ctx.fillText("Think you're faster?", centerX, ctaY);
          ctx.font = "500 22px system-ui, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillText("Try the same puzzle:", centerX, ctaY + 36);
        } else {
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "500 22px system-ui, sans-serif";
          ctx.fillText("Play this puzzle:", centerX, ctaY + 18);
        }

        const btnY = mode === "challenge" ? ctaY + 78 : ctaY + 52;
        const btnW = 320;
        const btnH = 56;
        const btnRect: Rect = { x: centerX - btnW / 2, y: btnY, w: btnW, h: btnH };
        fillRoundedRect(ctx, btnRect, 14, blueBtn);
        ctx.fillStyle = white;
        ctx.font = "600 22px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawPuzzleIcon(ctx, centerX - 92, btnY + (btnH - 28) / 2, 28);
        ctx.fillText("Play Phuzzle", centerX, btnY + btnH / 2);

        const urlY = btnY + btnH + 24;
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "500 20px system-ui, sans-serif";
        ctx.fillText("phuzzle.vercel.app", centerX, urlY);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) return;
        const file = new File([blob], "phuzzle-completion-card.png", {
          type: "image/png",
        });

        const shareText =
          mode === "challenge"
            ? buildChallengeShareMessage({
                elapsedSeconds: args.elapsedSeconds,
                pieceCount: args.pieceCount,
                playUrl,
              })
            : buildProgressShareMessage({
                elapsedSeconds: args.elapsedSeconds,
                pieceCount: args.pieceCount,
                accuracyPercent: args.accuracyPercent,
                playUrl,
              });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: mode === "challenge" ? "Puzzle Challenge" : "Phuzzle Result",
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
