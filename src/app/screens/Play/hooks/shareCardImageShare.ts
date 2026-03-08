import { buildProgressShareMessage, buildChallengeShareMessage } from "../shareMessages";

export async function shareOrDownloadCard(args: {
  blob: Blob;
  mode: "challenge" | "result";
  elapsedSeconds: number;
  pieceCount: number;
  accuracyPercent: number;
  playUrl: string;
}) {
  const { blob, mode, elapsedSeconds, pieceCount, accuracyPercent, playUrl } = args;
  const file = new File([blob], "phuzzle-completion-card.png", {
    type: "image/png",
  });

  const shareText =
    mode === "challenge"
      ? buildChallengeShareMessage({
          elapsedSeconds,
          pieceCount,
          playUrl,
        })
      : buildProgressShareMessage({
          elapsedSeconds,
          pieceCount,
          accuracyPercent,
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
}
