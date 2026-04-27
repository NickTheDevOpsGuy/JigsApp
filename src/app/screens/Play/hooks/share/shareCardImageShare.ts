import {
  buildProgressShareMessage,
  buildChallengeShareMessage,
} from "@/screens/Play/core/share/shareMessages";

export function isShareCancelledError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  return (
    typeof e === "object" && e !== null && (e as { name?: string }).name === "AbortError"
  );
}

export async function shareOrDownloadCard(args: {
  blob: Blob;
  mode: "challenge" | "result";
  elapsedSeconds: number;
  pieceCount: number;
  accuracyPercent: number;
  playUrl: string;
  moveCount?: number;
  rotationCount?: number;
  maxGroupSize?: number;
  puzzleName?: string;
  undoCount?: number;
  usedHint?: boolean;
}) {
  const {
    blob,
    mode,
    elapsedSeconds,
    pieceCount,
    accuracyPercent,
    playUrl,
    moveCount,
    rotationCount,
    maxGroupSize,
    puzzleName,
    undoCount,
    usedHint,
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
          rotationCount,
          maxGroupSize,
          puzzleName,
          undoCount,
          usedHint,
        })
      : buildProgressShareMessage({
          elapsedSeconds,
          pieceCount,
          accuracyPercent,
          playUrl,
          moveCount,
          rotationCount,
          puzzleName,
          undoCount,
          usedHint,
        });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        title: "Phuzzle",
        text: shareText,
        files: [file],
      });
      return;
    } catch (e) {
      if (isShareCancelledError(e)) {
        /* User dismissed the sheet — still offer a download below. */
      } else {
        throw e;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "phuzzle-completion-card.png";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
