/**
 * useShareCardImage - generate/share completion card PNG.
 */
import { useCallback, useState } from "react";
import { formatTime } from "../playUtils";
import {
  drawCardBackground,
  drawCoverImage,
  drawPuzzleIcon,
  fillRoundedRect,
  type Rect,
  strokeRoundedRect,
} from "./shareCardImageHelpers";
import { clampPercent, getDifficultyLabel, loadImage } from "./shareCardImageUtils";
import { shareOrDownloadCard } from "./shareCardImageShare";

type Percentile = { topPercent: number; totalPlayers: number } | null;

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
      /** Challenge = taunt copy ("Think you can beat me?", "Try the same puzzle:"). Result = informational only. */
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
        ctx.font = "500 20px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.86)";
        ctx.fillText(pieceLineShort, panel.x + 32 + icon2Size + footerGap, sectionY + 28);

        const ctaY = sectionY + 78;
        if (mode === "challenge") {
          ctx.textAlign = "center";
          ctx.fillStyle = white;
          ctx.font = "600 26px system-ui, sans-serif";
          ctx.fillText("Think you can beat me?", centerX, ctaY);
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
        await shareOrDownloadCard({
          blob,
          mode,
          elapsedSeconds: args.elapsedSeconds,
          pieceCount: args.pieceCount,
          accuracyPercent: args.accuracyPercent,
          playUrl,
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [isGenerating],
  );

  return { shareCard, isGenerating };
}
