import type { RefObject } from "react";
import type { PuzzleManager } from "@/puzzle/manager/PuzzleManager";
import type { PuzzleState } from "@/puzzle/core/types";
import type { SnapParticle } from "@/puzzle/canvas/utils/renderBoardHelpers";
import type { UndoSnapBackFrom } from "@/screens/Play/core/utils/playUtils";
import type { DebugFlags } from "@/screens/Play/core/utils/playScreenUtils";
import type { ViewportState } from "@/screens/Play/hooks/viewport/useViewport";
import type { PerfStats } from "@/screens/Play/components/overlay/ProfilerOverlay";

export interface UsePlayScreenAnimationArgs {
  manager: PuzzleManager | null;
  setState: (st: PuzzleState) => void;
  boardRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  imgRef: RefObject<HTMLImageElement | null>;
  popMapRef: RefObject<Map<string, number>>;
  lockMapRef: RefObject<Map<string, number>>;
  selectedIdRef: RefObject<string | null>;
  dragPreviewPieceIdRef: RefObject<string | null>;
  snapParticlesRef?: RefObject<SnapParticle[]>;
  debug: DebugFlags;
  magneticSnapEnabled: boolean;
  snapGlowEnabled: boolean;
  showGhostHint: boolean;
  showAlignmentGrid: boolean;
  showGhostWhenIdle?: boolean;
  showEdgeHighlight?: boolean;
  showClusterOutline?: boolean;
  lastInteractionRef?: RefObject<number>;
  viewport: ViewportState;
  perfStatsRef?: RefObject<PerfStats | null>;
  wrongRotationHintRef?: RefObject<{
    groupId: string;
    pieceIds: string[];
    triggeredAt: number;
  } | null>;
  batterySaverMode?: boolean;
  undoSnapBackRef?: RefObject<{
    fromPositions: UndoSnapBackFrom;
    startMs: number;
  } | null>;
  onUndoSnapBackComplete?: () => void;
  dailyVisualModifier?: "none" | "fog" | "night" | "sepia";
}
