/**
 * Uniform scale mapping puzzle content (assembled grid + pad margin) into the board CSS box.
 * Allows scale > 1 so a larger canvas still fills with the puzzle (no idle letterboxing when
 * the board element grows vs the initial layout footprint).
 */
export function computeBoardFitScale(
  boardCssW: number,
  boardCssH: number,
  contentW: number,
  contentH: number,
): number {
  if (contentW <= 0 || contentH <= 0) return 1;
  return Math.min(boardCssW / contentW, boardCssH / contentH);
}
