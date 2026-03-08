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
  usePlayScreenShortcuts({
    manager,
    state,
    setState,
    isPaused: ui.isPaused,
    showShortcuts: ui.showShortcuts,
    showHelpChoice: ui.showHelpChoice,
    showNewGameModal: ui.showNewGameModal,
    showTutorial: opts.showTutorial,
    selectedPieceId: ui.selectedPieceId,
    setSelectedPieceId: ui.setSelectedPieceId,
    setShowShortcuts: ui.setShowShortcuts,
    setShowHelpChoice: ui.setShowHelpChoice,
    setShowNewGameModal: ui.setShowNewGameModal,
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
