/**
 * Shortcuts wiring for play screen behavior. Split out to keep playScreenSceneBehavior.ts under 300 lines.
 */
import { usePlayScreenShortcuts } from "@/screens/Play/hooks/gameplay/usePlayScreenShortcuts";

export function usePlayScreenShortcutsFromSetup(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- setup shape is large and shared
  setup: any,
  opts: {
    showTutorial: boolean;
    selectCycle: (dir: 1 | -1) => void;
    onExtendSelection: () => void;
    onSnapBackAnimate: (fromPositions: unknown) => void;
    onRotate: () => void;
  },
) {
  const { ui, scene } = setup;
  const { manager, state, setState } = setup.managerResult;
  const anyModalOpen =
    ui.showThemeModal ||
    ui.showShortcuts ||
    ui.showHelpChoice ||
    ui.showChoosePuzzleModal ||
    ui.showNewGameModal ||
    false;

  usePlayScreenShortcuts({
    manager,
    state,
    setState,
    isPaused: ui.isPaused,
    undoRedoEnabled: ui.undoRedoEnabled,
    showShortcuts: ui.showShortcuts,
    showHelpChoice: ui.showHelpChoice,
    showNewGameModal: ui.showChoosePuzzleModal,
    showTutorial: opts.showTutorial || anyModalOpen,
    selectedPieceId: ui.selectedPieceId,
    setSelectedPieceId: ui.setSelectedPieceId,
    setShowShortcuts: ui.setShowShortcuts,
    setShowHelpChoice: ui.setShowHelpChoice,
    setShowNewGameModal: ui.setShowChoosePuzzleModal,
    setShowPreview: ui.setShowPreview,
    setShowGhostHint: ui.setShowGhostHint,
    setIsPaused: ui.setIsPaused,
    setSoundEnabled: ui.setSoundEnabled,
    setHapticsEnabled: ui.setHapticsEnabled,
    toggleFullscreen: ui.toggleFullscreen,
    selectCycle: opts.selectCycle,
    selectedIdRef: ui.selectedIdRef,
    onUndoSuccess: () => {
      scene.undoCountRef.current += 1;
    },
    onExtendSelection: opts.onExtendSelection,
    onSnapBackAnimate: opts.onSnapBackAnimate,
    onRotate: opts.onRotate,
  });
}
