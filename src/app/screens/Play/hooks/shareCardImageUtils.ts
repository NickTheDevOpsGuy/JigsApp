import { getCurrentSeason } from "@/utils/seasons";

export function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getDifficultyLabel(pieceCount: number): string {
  if (pieceCount <= 9) return "Easy";
  if (pieceCount <= 16) return "Medium";
  if (pieceCount <= 25) return "Hard";
  if (pieceCount <= 36) return "Expert";
  if (pieceCount <= 49) return "Master";
  if (pieceCount <= 64) return "Legend";
  return "Extreme";
}

export function getSeasonPalette() {
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

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}
