import { useEffect, useMemo, useState } from "react";
import type { GridSize } from "@/puzzle/core/types";
import { isDailyPuzzleSession } from "@/daily/dailyPuzzleCore";
import { createPuzzleSession } from "@/services/session/puzzleSessionService";
import { safeLocalStorage } from "@/utils/safeLocalStorage";

type UsePlayScreenShareSessionArgs = {
  isComplete: boolean;
  sessionId: string | null;
  grid: GridSize | null;
  storageKey: string;
  sessionIdParam: string;
  dailyParam: string;
  gridParam: string;
};

export function usePlayScreenShareSession({
  isComplete,
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
      isDailyPuzzleSession() ||
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
  }, [isComplete, sessionId, shareSessionId, grid, storageKey]);

  const puzzleShareUrl = useMemo(() => {
    if (shareSessionId) return `/play?${sessionIdParam}=${shareSessionId}`;
    if (isDailyPuzzleSession() && grid) {
      return `/play?${dailyParam}=1&${gridParam}=${grid.rows}x${grid.cols}`;
    }
    if (sessionId) return `/play?${sessionIdParam}=${sessionId}`;
    if (grid) return `/play?${gridParam}=${grid.rows}x${grid.cols}`;
    return "/";
  }, [dailyParam, grid, gridParam, sessionId, sessionIdParam, shareSessionId]);

  return { shareSessionId, puzzleShareUrl };
}
