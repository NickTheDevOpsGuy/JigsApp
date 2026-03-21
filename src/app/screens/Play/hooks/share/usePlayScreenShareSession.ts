import { useEffect, useMemo, useState } from "react";
import type { GridSize } from "@/puzzle/core/types";
import { createPuzzleSession } from "@/services/session/puzzleSessionService";
import { safeLocalStorage } from "@/utils/safeLocalStorage";
import { PUZZLE_ID_KEY } from "@/screens/Play/core/utils/playScreenUtils";

type UsePlayScreenShareSessionArgs = {
  isComplete: boolean;
  isDailySession: boolean;
  sessionId: string | null;
  grid: GridSize | null;
  storageKey: string;
  sessionIdParam: string;
  dailyParam: string;
  gridParam: string;
};

export function usePlayScreenShareSession({
  isComplete,
  isDailySession,
  sessionId,
  grid,
  storageKey,
  sessionIdParam,
  dailyParam,
  gridParam,
}: UsePlayScreenShareSessionArgs) {
  const [shareSessionId, setShareSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (
      !isComplete ||
      sessionId != null ||
      isDailySession ||
      shareSessionId != null ||
      !grid
    )
      return;
    const imageUrl = safeLocalStorage.getItem(storageKey) ?? "";
    if (!imageUrl) return;
    createPuzzleSession(imageUrl, grid, {
      pieces: [],
      elapsedSeconds: 0,
      isComplete: false,
    })
      .then((result) => {
        if (!("error" in result)) setShareSessionId(result.sessionId);
      })
      .catch(() => {});
  }, [isComplete, isDailySession, sessionId, shareSessionId, grid, storageKey]);

  const puzzleShareUrl = useMemo(() => {
    if (shareSessionId) return `/play?${sessionIdParam}=${shareSessionId}`;
    if (isDailySession && grid) {
      return `/play?${dailyParam}=1&${gridParam}=${grid.rows}x${grid.cols}`;
    }
    if (sessionId) return `/play?${sessionIdParam}=${sessionId}`;
    const puzzleId = safeLocalStorage.getItem(PUZZLE_ID_KEY);
    if (puzzleId && grid) {
      return `/play?puzzle=${encodeURIComponent(puzzleId)}&${gridParam}=${grid.rows}x${grid.cols}`;
    }
    if (grid) return `/play?${gridParam}=${grid.rows}x${grid.cols}`;
    return "/";
  }, [
    dailyParam,
    grid,
    gridParam,
    isDailySession,
    sessionId,
    sessionIdParam,
    shareSessionId,
  ]);

  return { shareSessionId, puzzleShareUrl };
}
