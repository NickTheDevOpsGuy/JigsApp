#!/bin/bash
# dump_phuzzel.sh
# Auto-splits all source files into zips under 38MB each.
# Run from repo root: bash dump_phuzzel.sh

MAX_BYTES=$((38 * 1024 * 1024))

FILES=(
  # ── Play screen ──────────────────────────────────────────────
  src/app/screens/Play/PlayScreen.tsx

  src/app/screens/Play/core/scene/PlayScreenScene.tsx
  src/app/screens/Play/core/scene/PlayScreenSceneImpl.tsx
  src/app/screens/Play/core/scene/PlayScreenView.tsx
  src/app/screens/Play/core/scene/playScreenScenePrimarySetup.ts
  src/app/screens/Play/core/scene/playScreenSceneBehavior.ts
  src/app/screens/Play/core/scene/playScreenSceneBehaviorShortcuts.ts
  src/app/screens/Play/core/scene/playScreenSceneLayout.ts
  src/app/screens/Play/core/scene/playScreenSceneLayoutInputs.ts
  src/app/screens/Play/core/scene/playScreenSceneLayoutTopBar.ts
  src/app/screens/Play/core/scene/playScreenSceneInteractions.ts
  src/app/screens/Play/core/scene/playScreenSceneOverlays.ts

  src/app/screens/Play/core/utils/playScreenUtils.ts
  src/app/screens/Play/core/utils/playScreenManagerConfig.ts
  src/app/screens/Play/core/utils/playUtils.ts
  src/app/screens/Play/core/utils/playScreenLayoutPropsBuilder.ts

  src/app/screens/Play/hooks/manager/usePlayScreenManager.ts
  src/app/screens/Play/hooks/manager/usePlayScreenManagerCore.ts
  src/app/screens/Play/hooks/manager/playScreenManagerInitHelpers.ts
  src/app/screens/Play/hooks/manager/playScreenManagerTypes.ts
  src/app/screens/Play/hooks/manager/playScreenManagerEvents.ts
  src/app/screens/Play/hooks/manager/useManagerBoardResize.ts

  src/app/screens/Play/hooks/lifecycle/usePlayScreenLifecycleEffects.ts
  src/app/screens/Play/hooks/lifecycle/usePlayScreenLifecycleEffectsTypes.ts
  src/app/screens/Play/hooks/lifecycle/usePlayScreenPersistence.ts
  src/app/screens/Play/hooks/lifecycle/usePlayScreenSecondaryEffects.ts
  src/app/screens/Play/hooks/lifecycle/usePuzzleLifecycle.ts

  src/app/screens/Play/hooks/state/usePlayScreenUI.ts
  src/app/screens/Play/hooks/state/usePlayScreenUICore.ts
  src/app/screens/Play/hooks/state/usePlayScreenSceneState.ts
  src/app/screens/Play/hooks/state/usePlayScreenUIPersistence.ts
  src/app/screens/Play/hooks/state/usePlayScreenUISystem.ts
  src/app/screens/Play/hooks/state/playScreenUIInitial.ts

  src/app/screens/Play/hooks/gameplay/usePlayScreenTrayPieces.ts
  src/app/screens/Play/hooks/gameplay/usePuzzleSession.ts
  src/app/screens/Play/hooks/gameplay/usePlayScreenTimer.ts
  src/app/screens/Play/hooks/gameplay/usePlayScreenMilestones.ts
  src/app/screens/Play/hooks/gameplay/usePlayScreenBoardInteractions.ts
  src/app/screens/Play/hooks/gameplay/usePlayScreenShortcuts.ts
  src/app/screens/Play/hooks/gameplay/useReplay.ts
  src/app/screens/Play/hooks/gameplay/useSnapComboAnnouncer.ts
  src/app/screens/Play/hooks/gameplay/useTimeModeConfig.ts
  src/app/screens/Play/hooks/gameplay/useAutoClearSelection.ts

  src/app/screens/Play/hooks/animation/usePlayScreenAnimation.ts
  src/app/screens/Play/hooks/animation/usePlayScreenAnimationCore.ts
  src/app/screens/Play/hooks/animation/usePlayScreenAnimationHelpers.ts
  src/app/screens/Play/hooks/animation/usePlayScreenAnimationRefs.ts
  src/app/screens/Play/hooks/animation/usePlayScreenAnimationTypes.ts
  src/app/screens/Play/hooks/animation/usePlayScreenAnimationConstants.ts

  src/app/screens/Play/hooks/input/usePointerHandlers.ts
  src/app/screens/Play/hooks/input/usePointerHandlersCore.ts

  src/app/screens/Play/hooks/pointerHandlers/pointerHandlersFactory.ts
  src/app/screens/Play/hooks/pointerHandlers/pointerHandlersFactoryCore.ts
  src/app/screens/Play/hooks/pointerHandlers/pointerHandlersEnd.ts
  src/app/screens/Play/hooks/pointerHandlers/pointerMoveRafQueue.ts
  src/app/screens/Play/hooks/pointerHandlers/mouseHandlers.ts
  src/app/screens/Play/hooks/pointerHandlers/touchHandlers.ts
  src/app/screens/Play/hooks/pointerHandlers/shared.ts
  src/app/screens/Play/hooks/pointerHandlers/types.ts

  src/app/screens/Play/hooks/system/useBoardRefsReady.ts
  src/app/screens/Play/hooks/system/useCoarsePointer.ts
  src/app/screens/Play/hooks/system/useHaptics.ts
  src/app/screens/Play/hooks/system/useInputHints.ts
  src/app/screens/Play/hooks/system/useAutoBatterySaver.ts
  src/app/screens/Play/hooks/system/useDevFrameSampler.ts
  src/app/screens/Play/hooks/system/useReducedMotionRef.ts

  src/app/screens/Play/hooks/viewport/useViewport.ts
  src/app/screens/Play/hooks/viewport/useViewportCore.ts
  src/app/screens/Play/hooks/viewport/viewportMath.ts
  src/app/screens/Play/hooks/viewport/viewportPinch.ts
  src/app/screens/Play/hooks/viewport/viewportStorage.ts

  src/app/screens/Play/hooks/topBar/usePlayScreenTopBarProps.ts
  src/app/screens/Play/hooks/topBar/usePlayScreenTopBarPropsCore.ts
  src/app/screens/Play/hooks/topBar/usePlayScreenTopBarPropsBuilders.ts
  src/app/screens/Play/hooks/topBar/usePlayScreenTopBarMenuToggles.ts
  src/app/screens/Play/hooks/topBar/usePlayScreenTopBarHudBuilders.ts

  src/app/screens/Play/components/layout/PlayScreenLayout.tsx

  src/app/screens/Play/components/completion/CompletionOverlay.tsx
  src/app/screens/Play/components/completion/CompletionOverlayCore.tsx
  src/app/screens/Play/components/completion/CompletionOverlayGate.tsx
  src/app/screens/Play/components/completion/CompletionOverlayActions.tsx
  src/app/screens/Play/components/completion/CompletionOverlayStats.tsx
  src/app/screens/Play/components/completion/CompletionOverlayReplayNextMenu.tsx
  src/app/screens/Play/components/completion/CompletionOverlayShareMenu.tsx
  src/app/screens/Play/components/completion/completionOverlayTypes.ts
  src/app/screens/Play/components/completion/completionOverlayPhrases.ts
  src/app/screens/Play/components/completion/useCompletionOverlayData.ts
  src/app/screens/Play/components/completion/useCompletionOverlayMenus.ts
  src/app/screens/Play/components/completion/useCompletionConfetti.ts

  src/app/screens/Play/components/hud/PlayHUD.tsx
  src/app/screens/Play/components/hud/PlayScreenTopBar.tsx
  src/app/screens/Play/components/hud/TopBarButtons.tsx
  src/app/screens/Play/components/hud/Minimap.tsx
  src/app/screens/Play/components/hud/SnapComboMeter.tsx

  src/app/screens/Play/components/overlay/PlayScreenModals.tsx
  src/app/screens/Play/components/overlay/PlayScreenOverlays.tsx
  src/app/screens/Play/components/overlay/PlayToasts.tsx
  src/app/screens/Play/components/overlay/PauseOverlay.tsx
  src/app/screens/Play/components/overlay/PlayConfirmModals.tsx

  src/app/screens/Play/styles/PlayScreen.module.css
  src/app/screens/Play/styles/PlayScreen.base.module.css
  src/app/screens/Play/styles/PlayScreen.base.page.module.css
  src/app/screens/Play/styles/PlayScreen.base.controls.layout.module.css
  src/app/screens/Play/styles/PlayScreen.base.controls.buttons.module.css
  src/app/screens/Play/styles/PlayScreen.base.hud.module.css
  src/app/screens/Play/styles/PlayScreen.board.module.css
  src/app/screens/Play/styles/PlayScreen.board.base.module.css
  src/app/screens/Play/styles/PlayScreen.board.layout.module.css
  src/app/screens/Play/styles/PlayScreen.board.responsive.module.css
  src/app/screens/Play/styles/PlayScreen.menu.module.css
  src/app/screens/Play/styles/PlayScreen.overlay.module.css

  # ── Shared components ─────────────────────────────────────────
  src/app/components/ChoosePuzzleModal/ChoosePuzzleModal.tsx
  src/app/components/ChoosePuzzleModal/ChoosePuzzleModal.module.css
  src/app/components/FilterPanel/FilterPanel.tsx
  src/app/components/FilterPanel/FilterPanel.module.css
  src/app/components/Modal/Modal.tsx
  src/app/components/Modal/Modal.module.css
  src/app/components/PieceTray/PieceTray.tsx
  src/app/components/PieceTray/PieceTrayHeader.tsx
  src/app/components/PieceTray/usePieceTrayDisplay.ts
  src/app/components/PieceTray/usePieceTrayScroll.ts
  src/app/components/PieceTray/usePieceTrayThumbs.ts
  src/app/components/PieceTray/PieceTray.module.css
  src/app/components/PieceTray/PieceTray.module.base.module.css
  src/app/components/PieceTray/PieceTray.module.layout.module.css
  src/app/components/PieceTray/PieceTray.module.responsive.module.css

  # ── Puzzle engine ─────────────────────────────────────────────
  src/app/puzzle/core/types.ts
  src/app/puzzle/core/shape.ts
  src/app/puzzle/core/colorUtils.ts

  src/app/puzzle/factories/createInitialPieces.ts

  src/app/puzzle/manager/PuzzleManager.ts
  src/app/puzzle/manager/PuzzleManagerCore.ts
  src/app/puzzle/manager/PuzzleManagerRuntime.ts
  src/app/puzzle/manager/undoManager.ts

  src/app/puzzle/manager/engine/PuzzleManagerEngine.ts
  src/app/puzzle/manager/engine/PuzzleManagerEngineCore.ts
  src/app/puzzle/manager/engine/PuzzleManagerEngineActions.ts
  src/app/puzzle/manager/engine/PuzzleManagerEngineInteractions.ts
  src/app/puzzle/manager/engine/PuzzleManagerEngineState.ts
  src/app/puzzle/manager/engine/puzzleManagerEngineStateHelpers.ts

  src/app/puzzle/manager/ops/puzzleManagerSnapOps.ts
  src/app/puzzle/manager/ops/puzzleManagerBoardOps.ts
  src/app/puzzle/manager/ops/puzzleManagerPointerOps.ts
  src/app/puzzle/manager/ops/puzzleManagerRestore.ts
  src/app/puzzle/manager/ops/puzzleManagerActionsOps.ts
  src/app/puzzle/manager/ops/puzzleManagerClamp.ts
  src/app/puzzle/manager/ops/puzzleManagerNeighborSnapOps.ts

  src/app/puzzle/manager/state/puzzleManagerTypes.ts
  src/app/puzzle/manager/state/puzzleManagerUtils.ts
  src/app/puzzle/manager/state/puzzleManagerDerivedState.ts
  src/app/puzzle/manager/state/puzzleManagerGroupHelpers.ts

  src/app/puzzle/snap/puzzleSnap.ts
  src/app/puzzle/snap/SnapLogic.ts

  src/app/puzzle/storage/puzzleStorage.ts

  src/app/puzzle/groups/groupUtils.ts
  src/app/puzzle/groups/groupCollision.ts

  src/app/puzzle/canvas/render/renderBoard.ts
  src/app/puzzle/canvas/render/renderBoardDraw.ts
  src/app/puzzle/canvas/render/renderBoardDrawPiece.ts
  src/app/puzzle/canvas/render/renderBoardDrawPieceCore.ts
  src/app/puzzle/canvas/render/renderBoardDrawPieceHelpers.ts
  src/app/puzzle/canvas/render/renderBoardDrawOverlays.ts
  src/app/puzzle/canvas/render/renderBoardGhostHints.ts
  src/app/puzzle/canvas/render/renderTrayPiece.ts

  src/app/puzzle/canvas/utils/renderBoardHelpers.ts
  src/app/puzzle/canvas/utils/renderBoardHelpersCore.ts
  src/app/puzzle/canvas/utils/renderBoardHelpersGlow.ts
  src/app/puzzle/canvas/utils/renderBoardTypes.ts
  src/app/puzzle/canvas/utils/pickPiece.ts
  src/app/puzzle/canvas/utils/pieceDrawOrder.ts

  # ── Daily ─────────────────────────────────────────────────────
  src/app/daily/dailyPuzzle.ts
  src/app/daily/dailyPuzzleCore.ts
  src/app/daily/dailyPuzzleCoreImpl.ts
  src/app/daily/dailyGridOptions.ts

  # ── Data / packs ──────────────────────────────────────────────
  src/app/data/packs/samplePuzzles.ts
  src/app/data/packs/puzzlePacks.ts
  src/app/data/packs/packMetadata.ts
  src/app/data/packs/loadPacksData.ts
  src/app/data/packs/packCompletion.ts

  # ── App root ──────────────────────────────────────────────────
  src/app/App.tsx
  src/app/main.tsx

  # ── Config ────────────────────────────────────────────────────
  package.json
  tsconfig.app.json
  vite.config.ts
)

# ── Auto-split into zips under MAX_BYTES ──────────────────────
zip_index=1
current_zip="phuzzel_part${zip_index}.zip"
current_size=0
total_files=0
skipped=0

rm -f phuzzel_part*.zip

echo "Scanning ${#FILES[@]} files..."
echo ""

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "  SKIP (missing): $f"
    skipped=$((skipped + 1))
    continue
  fi

  file_size=$(wc -c < "$f")

  if (( current_size + file_size > MAX_BYTES && current_size > 0 )); then
    echo "→ Sealed $current_zip ($(du -sh "$current_zip" | cut -f1))"
    zip_index=$((zip_index + 1))
    current_zip="phuzzel_part${zip_index}.zip"
    current_size=0
  fi

  zip -q "$current_zip" "$f"
  current_size=$((current_size + file_size))
  total_files=$((total_files + 1))
done

echo "→ Sealed $current_zip ($(du -sh "$current_zip" | cut -f1))"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Packed $total_files files, skipped $skipped missing."
echo "Upload ALL of these:"
ls -lh phuzzel_part*.zip
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
