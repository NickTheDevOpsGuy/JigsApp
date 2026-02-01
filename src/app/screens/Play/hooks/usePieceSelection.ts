import { useState, useEffect, useRef, useCallback } from "react";
import type { Piece } from "@/puzzle/types";

/**
 * Hook to manage piece selection for keyboard controls.
 */
export function usePieceSelection(pieces: Piece[] | undefined) {
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
  const selectedPieceIdRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedPieceIdRef.current = selectedPieceId;
  }, [selectedPieceId]);

  // Get unplaced pieces (available for selection)
  const unplacedPieces = pieces?.filter((p) => !p.isPlaced && !p.inTray) ?? [];

  const selectNextPiece = useCallback(() => {
    if (unplacedPieces.length === 0) return;

    const currentIndex = unplacedPieces.findIndex((p) => p.id === selectedPieceId);
    const newIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % unplacedPieces.length;
    setSelectedPieceId(unplacedPieces[newIndex].id);
  }, [unplacedPieces, selectedPieceId]);

  const selectPrevPiece = useCallback(() => {
    if (unplacedPieces.length === 0) return;

    const currentIndex = unplacedPieces.findIndex((p) => p.id === selectedPieceId);
    const newIndex =
      currentIndex < 0
        ? unplacedPieces.length - 1
        : (currentIndex - 1 + unplacedPieces.length) % unplacedPieces.length;
    setSelectedPieceId(unplacedPieces[newIndex].id);
  }, [unplacedPieces, selectedPieceId]);

  const getSelectedPiece = useCallback(() => {
    if (!selectedPieceId || !pieces) return null;
    return pieces.find((p) => p.id === selectedPieceId) ?? null;
  }, [selectedPieceId, pieces]);

  // Auto-select first piece if current selection is invalid
  const ensureValidSelection = useCallback(() => {
    if (unplacedPieces.length === 0) {
      if (selectedPieceId) setSelectedPieceId(null);
      return null;
    }

    const current = unplacedPieces.find((p) => p.id === selectedPieceId);
    if (!current) {
      setSelectedPieceId(unplacedPieces[0].id);
      return unplacedPieces[0];
    }
    return current;
  }, [unplacedPieces, selectedPieceId]);

  return {
    selectedPieceId,
    setSelectedPieceId,
    selectedPieceIdRef,
    selectNextPiece,
    selectPrevPiece,
    getSelectedPiece,
    ensureValidSelection,
    unplacedPieces,
  };
}
