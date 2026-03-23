import {
  buildProgressShareMessage,
  buildChallengeShareMessage,
} from "@/screens/Play/core/share/shareMessages";

export async function shareOrDownloadCard(args: {
  blob: Blob;
  mode: "challenge" | "result";
  elapsedSeconds: number;
  pieceCount: number;
  accuracyPercent: number;
  playUrl: string;
  moveCount?: number;
  maxGroupSize?: number;
  puzzleName?: string;
}) {
  const {
    blob,
    mode,
    elapsedSeconds,
    pieceCount,
    accuracyPercent,
    playUrl,
    moveCount,
    maxGroupSize,
    puzzleName,
  } = args;
  const file = new File([blob], "phuzzle-completion-card.png", {
    type: "image/png",
  });

  const shareText =
    mode === "challenge"
      ? buildChallengeShareMessage({
          elapsedSeconds,
          pieceCount,
          playUrl,
          moveCount,
          maxGroupSize,
          puzzleName,
        })
      : buildProgressShareMessage({
          elapsedSeconds,
          pieceCount,
          accuracyPercent,
          playUrl,
          moveCount,
          puzzleName,
        });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "Phuzzle",
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
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
