/**
 * PlayConfirmModals – Reset local stats and Clear cache confirm dialogs.
 * Keeps PlayScreen.tsx shorter by encapsulating modal props and confirm logic.
 */
import { useNavigate } from "react-router-dom";
import { ConfirmModal } from "@/components/Modal/Modal";
import { clearPuzzleState } from "@/puzzle/storage/puzzleStorage";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { BEST_TIME_PREFIX } from "@/screens/Play/core/time/timeMode";

interface PlayConfirmModalsProps {
  showResetStatsConfirm: boolean;
  setShowResetStatsConfirm: (v: boolean) => void;
  showClearCacheConfirm: boolean;
  setShowClearCacheConfirm: (v: boolean) => void;
}

export function PlayConfirmModals({
  showResetStatsConfirm,
  setShowResetStatsConfirm,
  showClearCacheConfirm,
  setShowClearCacheConfirm,
}: PlayConfirmModalsProps) {
  const navigate = useNavigate();

  return (
    <>
      <ConfirmModal
        isOpen={showResetStatsConfirm}
        onClose={() => setShowResetStatsConfirm(false)}
        onConfirm={() => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < safeLocalStorage.length; i++) {
            const k = safeLocalStorage.key(i);
            if (k?.startsWith(BEST_TIME_PREFIX)) keysToRemove.push(k);
          }
          keysToRemove.forEach((k) => safeLocalStorage.removeItem(k));
          setShowResetStatsConfirm(false);
        }}
        title="Reset Local Stats?"
        message="This will clear all local best times. This cannot be undone."
        confirmText="Reset"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showClearCacheConfirm}
        onClose={() => setShowClearCacheConfirm(false)}
        onConfirm={() => {
          clearPuzzleState();
          const keysToRemove: string[] = [];
          for (let i = 0; i < safeLocalStorage.length; i++) {
            const k = safeLocalStorage.key(i);
            if (
              k?.startsWith("phuzzle:viewport:") ||
              k === "phuzzle:puzzleState" ||
              k === "phuzzle:puzzleStateBackup"
            )
              keysToRemove.push(k);
          }
          keysToRemove.forEach((k) => safeLocalStorage.removeItem(k));
          setShowClearCacheConfirm(false);
          navigate("/");
        }}
        title="Clear Cache?"
        message="This will clear saved puzzle state and viewport settings. You will return to the menu."
        confirmText="Clear"
        cancelText="Cancel"
        variant="danger"
      />
    </>
  );
}
