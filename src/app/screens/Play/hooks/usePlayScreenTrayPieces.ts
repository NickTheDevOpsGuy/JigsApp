import { useMemo } from "react";
import type { MutableRefObject } from "react";
import type { Piece, PuzzleState } from "@/puzzle/types";

type TrayPiecesCacheRef = MutableRefObject<{ key: string; pieces: Piece[] }>;

export function usePlayScreenTrayPieces(
  state: PuzzleState | null,
  trayPiecesKeyRef: TrayPiecesCacheRef,
) {
  return useMemo(() => {
    const next = state ? state.pieces.filter((p) => p.inTray) : [];
    const key =
      next.length === 0
        ? ""
        : next
            .map((p) => `${p.id}:${p.rotation}`)
            .sort()
            .join(",");
    const ref = trayPiecesKeyRef.current;
    if (ref.key === key && ref.pieces.length === next.length) return ref.pieces;
    ref.key = key;
    ref.pieces = next;
    return next;
  }, [state, trayPiecesKeyRef]);
}
