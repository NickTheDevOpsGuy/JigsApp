/**
 * useShareCardImage - generate/share completion card PNG.
 */
import { useCallback, useState } from "react";
import { getCurrentSeason } from "@/utils/seasons";
import { formatTime } from "../playUtils";
import { buildProgressShareMessage } from "../shareMessages";

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

function getPiecesLine(pieceCount: number): string {
  if (pieceCount <= 0) return "Custom Puzzle";
  return `${pieceCount} Pieces • ${getDifficultyLabel(pieceCount)}`;
}

function getSeasonPalette() {
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

function drawChipRow(
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
        canvas.height = 1920;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const palette = args.useSeasonalFrame
          ? getSeasonPalette()
          : {
              bg1: "#141723",
              bg2: "#2a2f45",
              frame: "#8f9bc7",
              accent: "#f3f5ff",
              panel: "rgba(12, 16, 28, 0.76)",
              chip: "rgba(143, 155, 199, 0.2)",
            };

        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, palette.bg1);
        bgGradient.addColorStop(1, palette.bg2);
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const glow = ctx.createRadialGradient(
          canvas.width * 0.22,
          canvas.height * 0.12,
          0,
          canvas.width * 0.22,
          canvas.height * 0.12,
          1300,
        );
        glow.addColorStop(0, "rgba(255,255,255,0.22)");
        glow.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const panel: Rect = { x: 56, y: 72, w: 968, h: 1776 };
        fillRoundedRect(ctx, panel, 48, palette.panel);
        strokeRoundedRect(ctx, panel, 48, "rgba(255,255,255,0.14)", 2);
        strokeRoundedRect(ctx, panel, 48, palette.frame, 3);

        ctx.save();
        roundedRectPath(ctx, panel, 48);
        ctx.clip();
        const panelShine = ctx.createLinearGradient(0, panel.y, 0, panel.y + 420);
        panelShine.addColorStop(0, "rgba(255,255,255,0.14)");
        panelShine.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = panelShine;
        ctx.fillRect(panel.x, panel.y, panel.w, 420);
        ctx.restore();

        const centerX = panel.x + panel.w / 2;
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = palette.accent;
        ctx.font = "700 62px system-ui, sans-serif";
        ctx.fillText("PUZZLE SHARE", centerX, panel.y + 124);
        ctx.font = "500 34px system-ui, sans-serif";
        ctx.fillStyle = "rgba(241,245,255,0.9)";
        ctx.fillText("Same puzzle • same settings", centerX, panel.y + 176);

        const heroFrame: Rect = { x: panel.x + 62, y: panel.y + 236, w: 844, h: 980 };
        fillRoundedRect(ctx, heroFrame, 34, "rgba(9,12,21,0.84)");
        strokeRoundedRect(ctx, heroFrame, 34, palette.frame, 3);

        const heroImage: Rect = {
          x: heroFrame.x + 20,
          y: heroFrame.y + 20,
          w: heroFrame.w - 40,
          h: heroFrame.h - 40,
        };
        drawCoverImage(ctx, img, heroImage, 24);

        ctx.save();
        roundedRectPath(ctx, heroImage, 24);
        ctx.clip();
        const heroShade = ctx.createLinearGradient(
          0,
          heroImage.y + heroImage.h - 220,
          0,
          heroImage.y + heroImage.h,
        );
        heroShade.addColorStop(0, "rgba(0,0,0,0)");
        heroShade.addColorStop(1, "rgba(0,0,0,0.32)");
        ctx.fillStyle = heroShade;
        ctx.fillRect(heroImage.x, heroImage.y, heroImage.w, heroImage.h);
        ctx.restore();

        const accuracy = clampPercent(args.accuracyPercent);
        const pieceLine = getPiecesLine(args.pieceCount);
        const playersLine =
          args.percentile && args.percentile.totalPlayers >= 5
            ? `${args.percentile.totalPlayers.toLocaleString()} players solved this size today`
            : "Share and compare times";

        const statsTop = heroFrame.y + heroFrame.h + 96;
        ctx.fillStyle = palette.accent;
        ctx.font = "700 68px system-ui, sans-serif";
        ctx.fillText(`Time ${formatTime(args.elapsedSeconds)}`, centerX, statsTop);
        ctx.font = "600 40px system-ui, sans-serif";
        ctx.fillStyle = "rgba(246,249,255,0.95)";
        ctx.fillText(pieceLine, centerX, statsTop + 66);
        ctx.font = "500 31px system-ui, sans-serif";
        ctx.fillStyle = "rgba(227,233,248,0.9)";
        ctx.fillText(playersLine, centerX, statsTop + 116);

        ctx.font = "600 30px system-ui, sans-serif";
        drawChipRow(
          ctx,
          { x: panel.x + 42, y: statsTop + 140, w: panel.w - 84, h: 82 },
          [
            `Accuracy ${accuracy}%`,
            `Moves ${Math.max(0, args.moveCount)}`,
            args.pieceCount > 0 ? `${args.pieceCount} pieces` : "Custom puzzle",
          ],
          palette.chip,
          "rgba(245,249,255,0.95)",
        );

        const footerCard: Rect = {
          x: panel.x + 116,
          y: panel.y + panel.h - 148,
          w: panel.w - 232,
          h: 96,
        };
        fillRoundedRect(ctx, footerCard, 24, palette.chip);
        strokeRoundedRect(ctx, footerCard, 24, "rgba(255,255,255,0.16)");
        ctx.textAlign = "center";
        ctx.fillStyle = palette.accent;
        ctx.font = "600 36px system-ui, sans-serif";
        ctx.fillText("Open in Phuzzle", centerX, footerCard.y + 43);
        ctx.font = "500 24px system-ui, sans-serif";
        ctx.fillStyle = "rgba(233,238,251,0.9)";
        ctx.fillText("Link is included with your message", centerX, footerCard.y + 74);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (!blob) return;
        const file = new File([blob], "phuzzle-completion-card.png", {
          type: "image/png",
        });

        // Sharer’s time; playUrl = exact puzzle + difficulty (daily?grid= or session=)
        const shareText = buildProgressShareMessage({
          elapsedSeconds: args.elapsedSeconds,
          pieceCount: args.pieceCount,
          accuracyPercent: args.accuracyPercent,
          playUrl,
        });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: "Phuzzle Puzzle Share",
            text: shareText,
            url: playUrl,
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
