import { useEffect } from "react";
import type { MutableRefObject } from "react";

type UseAutoClearSelectionArgs = {
  selectedPieceId: string | null;
  selectionExtendTrigger: number;
  setSelectedPieceId: (id: string | null) => void;
  selectedIdRef: MutableRefObject<string | null>;
  bump: () => void;
};

export function useAutoClearSelection({
  selectedPieceId,
  selectionExtendTrigger,
  setSelectedPieceId,
  selectedIdRef,
  bump,
}: UseAutoClearSelectionArgs) {
  useEffect(() => {
    if (selectedPieceId == null) return;
    const timeoutId = setTimeout(() => {
      setSelectedPieceId(null);
      selectedIdRef.current = null;
      bump();
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [selectedPieceId, selectionExtendTrigger, setSelectedPieceId, selectedIdRef, bump]);
}
