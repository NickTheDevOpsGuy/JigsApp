/**
 * PieceTray – horizontal scrollable tray of unplaced pieces; filter by section, sort by grid/color.
 */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type { Piece } from "@/puzzle/types";
import { getAverageColor, areColorsSimilar, type ColorInfo } from "@/puzzle/colorUtils";
import { renderTrayPiece } from "@/puzzle/canvas/renderTrayPiece";
import { Settings, ChevronRight, ChevronLeft } from "lucide-react";
import styles from "./PieceTray.module.css";
import playStyles from "@/screens/Play/PlayScreen.module.css";

type TraySection = "all" | "corners" | "edges" | "center";
type SortMode = "grid" | "color";

const THUMB_NORMAL = 80;
const THUMB_COMPACT = 64;

const TRAY_COMPACT_KEY = "phuzzle:trayCompact";

/** Tray height: fits thumbnails comfortably. */
function getTrayHeight(totalPieces: number, isMobile: boolean): number {
  const base = isMobile ? 145 : 110;
  const cap = isMobile ? 220 : 200;
  if (totalPieces <= 9) return base;
  if (totalPieces <= 16) return base + 15;
  if (totalPieces <= 25) return base + 25;
  if (totalPieces <= 36) return base + 35;
  if (totalPieces <= 64) return base + 45;
  if (totalPieces <= 100) return base + 55;
  return Math.min(cap, base + 65);
}

/** Deterministic values per piece for scatter animation. */
function scatterVars(pieceId: string): { rotation: number; dx: number; dy: number } {
  let h = 0;
  for (let i = 0; i < pieceId.length; i++) h = (h << 5) - h + pieceId.charCodeAt(i);
  const h2 = h * 31 + pieceId.length;
  return {
    rotation: (h % 31) - 15,
    dx: ((h % 17) - 8) * 4,
    dy: ((h2 % 17) - 8) * 4,
  };
}

type Props = {
  pieces: Piece[];
  image: HTMLImageElement | null;
  grid: { rows: number; cols: number };
  onPieceClick: (pieceId: string) => void;
  puzzleKey?: string | number;
  clusterMode?: boolean;
  selectedIds?: Set<string>;
  onSelectionToggle?: (pieceId: string) => void;
  onCreateCluster?: (pieceIds: string[]) => void;
  onClusterModeToggle?: () => void;
};

function isCorner(p: Piece, grid: { rows: number; cols: number }) {
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  return (
    (p.row === 0 && p.col === 0) ||
    (p.row === 0 && p.col === lastCol) ||
    (p.row === lastRow && p.col === 0) ||
    (p.row === lastRow && p.col === lastCol)
  );
}

function isEdge(p: Piece, grid: { rows: number; cols: number }) {
  const lastRow = grid.rows - 1;
  const lastCol = grid.cols - 1;
  if (isCorner(p, grid)) return false;
  return p.row === 0 || p.row === lastRow || p.col === 0 || p.col === lastCol;
}

export const PieceTray = forwardRef<HTMLDivElement, Props>(function PieceTray(
  {
    pieces,
    image,
    grid,
    onPieceClick,
    puzzleKey,
    clusterMode = false,
    selectedIds,
    onSelectionToggle,
    onCreateCluster,
    onClusterModeToggle,
  },
  ref,
) {
  const [section, setSection] = useState<TraySection>("all");
  const [scatterActive, setScatterActive] = useState(false);
  const lastScatterKeyRef = useRef<string | number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (
      puzzleKey == null ||
      prefersReducedMotion ||
      pieces.length === 0 ||
      lastScatterKeyRef.current === puzzleKey
    ) {
      return;
    }
    lastScatterKeyRef.current = puzzleKey;
    setScatterActive(true);
    const id = setTimeout(() => setScatterActive(false), 900);
    return () => clearTimeout(id);
  }, [puzzleKey, prefersReducedMotion, pieces.length]);
  const [sortMode, setSortMode] = useState<SortMode>("grid");
  const [shuffledOrder, setShuffledOrder] = useState<string[] | null>(null);
  const [colorHighlight, setColorHighlight] = useState(false);
  const [highlightAnchorId, setHighlightAnchorId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<
    "filter" | "sort" | "view" | "actions" | null
  >(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    bottom: number;
  } | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const cogRef = useRef<HTMLButtonElement>(null);

  const totalPieces = grid.rows * grid.cols;
  const [isNarrow, setIsNarrow] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia("(max-width: 600px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 600px)");
    const handler = () => setIsNarrow(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  const trayHeight = getTrayHeight(totalPieces, isNarrow);

  // Expanded by default; persist user preference for Compact
  const [compact, setCompact] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(TRAY_COMPACT_KEY) === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(TRAY_COMPACT_KEY, String(compact));
    } catch {
      /* ignore */
    }
  }, [compact]);
  const thumbSize = compact ? THUMB_COMPACT : THUMB_NORMAL;

  // Precompute color for sorting and highlight; computed once per puzzle.
  const colorById = useMemo(() => {
    const m = new Map<string, ColorInfo>();
    if (!image) return m;
    for (const p of pieces) {
      m.set(p.id, getAverageColor(image, p, grid));
    }
    return m;
  }, [image, pieces, grid]);

  const hueById = useMemo(() => {
    const m = new Map<string, number>();
    for (const [id, c] of colorById) m.set(id, c.hue);
    return m;
  }, [colorById]);

  const byGrid = (a: Piece, b: Piece) =>
    a.row - b.row || a.col - b.col || a.id.localeCompare(b.id);

  const byHue = (a: Piece, b: Piece) => {
    const ha = hueById.get(a.id);
    const hb = hueById.get(b.id);
    if (ha == null && hb == null) return byGrid(a, b);
    if (ha == null) return 1;
    if (hb == null) return -1;
    return ha - hb || byGrid(a, b);
  };

  const sortPieces = (arr: Piece[]) => {
    const next = [...arr];
    const primarySort = sortMode === "color" && image ? byHue : byGrid;
    next.sort((a, b) => {
      const cmp = primarySort(a, b);
      if (cmp !== 0) return cmp;
      return a.groupId.localeCompare(b.groupId);
    });
    return next;
  };

  const shuffleTray = useCallback(() => {
    const ids = pieces.map((p) => p.id);
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    setShuffledOrder(shuffled);
  }, [pieces]);

  const sections = useMemo(() => {
    const corners = pieces.filter((p) => isCorner(p, grid));
    const edges = pieces.filter((p) => isEdge(p, grid));
    const center = pieces.filter((p) => !isCorner(p, grid) && !isEdge(p, grid));

    const all = sortPieces(pieces);
    const cornersS = sortPieces(corners);
    const edgesS = sortPieces(edges);
    const centerS = sortPieces(center);

    const applyShuffle = (arr: Piece[]) => {
      if (!shuffledOrder || arr.length === 0) return arr;
      const orderMap = new Map(shuffledOrder.map((id, i) => [id, i]));
      const inOrder = arr.filter((p) => orderMap.has(p.id));
      const notInOrder = arr.filter((p) => !orderMap.has(p.id));
      inOrder.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      return [...inOrder, ...notInOrder];
    };

    return {
      all: applyShuffle(all),
      corners: applyShuffle(cornersS),
      edges: applyShuffle(edgesS),
      center: applyShuffle(centerS),
    };
  }, [pieces, grid, sortMode, image, hueById, shuffledOrder]);

  const displayed = sections[section];

  // Pieces with similar dominant color when highlight mode + anchor set
  const highlightedIds = useMemo(() => {
    if (!colorHighlight || !highlightAnchorId || !image) return new Set<string>();
    const anchorColor = colorById.get(highlightAnchorId);
    if (!anchorColor) return new Set<string>();
    const set = new Set<string>();
    for (const [id, c] of colorById) {
      if (areColorsSimilar(anchorColor, c)) set.add(id);
    }
    return set;
  }, [colorHighlight, highlightAnchorId, colorById, image]);

  const emptyText =
    pieces.length === 0
      ? "All pieces on board! Drag pieces here to store them."
      : "Drag pieces here to store them";

  // Generate jigsaw-shaped thumbnails using the same clip path as the board renderer.
  const thumbsById = useMemo(() => {
    const m = new Map<string, string>();
    if (!image) return m;
    const padding = compact ? 4 : 6;
    const maxW = thumbSize - padding;
    const maxH = thumbSize - padding;

    for (const p of displayed) {
      const scale = Math.min(maxW / p.w, maxH / p.h);
      const assembledW = grid.cols * p.tileW;
      const assembledH = grid.rows * p.tileH;
      const c = renderTrayPiece(p, image, assembledW, assembledH, scale);
      m.set(p.id, c.toDataURL("image/png"));
    }

    return m;
  }, [displayed, image, grid, thumbSize, compact]);

  const updateScrollProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    // Only show indicator when there's meaningful overflow (avoids rounding/subpixel false positives)
    setCanScroll(maxScroll > 8);
    const pct = maxScroll <= 0 ? 1 : Math.min(1, Math.max(0, scrollLeft / maxScroll));
    setScrollProgress(pct);
  }, []);

  const scrollBy = useCallback((delta: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: delta * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateScrollProgress();
    el.addEventListener("scroll", updateScrollProgress);
    const ro = new ResizeObserver(updateScrollProgress);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollProgress);
      ro.disconnect();
    };
  }, [updateScrollProgress, displayed.length]);

  const showCompactToggle = pieces.length >= 25;

  useLayoutEffect(() => {
    if (!optionsOpen || !optionsRef.current) {
      setMenuPosition(null);
      return;
    }
    const rect = optionsRef.current.getBoundingClientRect();
    setMenuPosition({
      left: rect.left,
      bottom: window.innerHeight - rect.top + 4,
    });
  }, [optionsOpen]);

  useEffect(() => {
    if (!optionsOpen) {
      setExpandedSection(null);
      return;
    }
    const onPointerDown = (e: PointerEvent) => {
      const el = optionsRef.current;
      const panel = document.getElementById("tray-options-portal");
      if (!el || (e.target && el.contains(e.target as Node))) return;
      if (cogRef.current && cogRef.current.contains(e.target as Node)) return;
      if (panel && panel.contains(e.target as Node)) return;
      setOptionsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (expandedSection) setExpandedSection(null);
        else setOptionsOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [optionsOpen, expandedSection]);

  return (
    <div
      className={`${styles.tray} ${compact ? styles.trayCompact : ""}`}
      ref={ref}
      style={{ height: trayHeight }}
    >
      <div className={styles.header} ref={optionsRef}>
        <div className={styles.titleRow}>
          <span className={styles.title}>Piece Drawer ({pieces.length})</span>
          {(colorHighlight || clusterMode) && (
            <span className={styles.modeBadge} aria-live="polite">
              {clusterMode ? "Cluster" : "Highlight"}
            </span>
          )}
          <button
            ref={cogRef}
            type="button"
            className={styles.cogBtn}
            onClick={() => setOptionsOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={optionsOpen}
            aria-label={optionsOpen ? "Close options" : "Open options"}
            title="Options"
          >
            <Settings size={16} />
          </button>
        </div>

        {optionsOpen &&
          menuPosition &&
          createPortal(
            <div
              id="tray-options-portal"
              className={styles.trayOptionsPortal}
              role="menu"
              style={{
                left: menuPosition.left,
                bottom: menuPosition.bottom,
              }}
            >
              <div className={playStyles.headerMenuSection}>Piece Drawer</div>
              <button
                type="button"
                className={playStyles.headerMenuSubmenuTrigger}
                role="menuitem"
                onClick={() =>
                  setExpandedSection((s) => (s === "filter" ? null : "filter"))
                }
              >
                Filter
                <ChevronRight
                  size={16}
                  className={`${playStyles.headerMenuChevron} ${expandedSection === "filter" ? playStyles.headerMenuChevronExpanded : ""}`}
                />
              </button>
              {expandedSection === "filter" && (
                <div className={playStyles.headerMenuNested}>
                  {(["all", "edges", "center", "corners"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={playStyles.headerMenuItem}
                      role="menuitem"
                      onClick={() => setSection(s)}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                      {section === s && (
                        <span className={playStyles.headerMenuCheck}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className={playStyles.headerMenuSubmenuTrigger}
                role="menuitem"
                onClick={() =>
                  setExpandedSection((s) => (s === "sort" ? null : "sort"))
                }
              >
                Sort
                <ChevronRight
                  size={16}
                  className={`${playStyles.headerMenuChevron} ${expandedSection === "sort" ? playStyles.headerMenuChevronExpanded : ""}`}
                />
              </button>
              {expandedSection === "sort" && (
                <div className={playStyles.headerMenuNested}>
                  <button
                    type="button"
                    className={playStyles.headerMenuItem}
                    role="menuitem"
                    onClick={() => {
                      setSortMode("grid");
                      setShuffledOrder(null);
                    }}
                  >
                    Grid
                    {sortMode === "grid" && (
                      <span className={playStyles.headerMenuCheck}>✓</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className={playStyles.headerMenuItem}
                    role="menuitem"
                    disabled={!image}
                    title={
                      !image ? "Load an image to enable color sorting" : undefined
                    }
                    onClick={() => {
                      setSortMode("color");
                      setShuffledOrder(null);
                    }}
                  >
                    Color
                    {sortMode === "color" && (
                      <span className={playStyles.headerMenuCheck}>✓</span>
                    )}
                  </button>
                </div>
              )}

              <button
                type="button"
                className={playStyles.headerMenuSubmenuTrigger}
                role="menuitem"
                onClick={() =>
                  setExpandedSection((s) => (s === "view" ? null : "view"))
                }
              >
                View
                <ChevronRight
                  size={16}
                  className={`${playStyles.headerMenuChevron} ${expandedSection === "view" ? playStyles.headerMenuChevronExpanded : ""}`}
                />
              </button>
              {expandedSection === "view" && (
                <div className={playStyles.headerMenuNested}>
                  {showCompactToggle && (
                    <button
                      type="button"
                      className={playStyles.headerMenuItem}
                      role="menuitem"
                      onClick={() => setCompact((c) => !c)}
                    >
                      Compact
                      {compact ? (
                        <span className={playStyles.headerMenuCheck}>✓</span>
                      ) : null}
                    </button>
                  )}
                  <button
                    type="button"
                    className={playStyles.headerMenuItem}
                    role="menuitem"
                    disabled={!image}
                    title={
                      !image
                        ? "Load an image to enable"
                        : "Highlight pieces by dominant color"
                    }
                    onClick={() => {
                      const next = !colorHighlight;
                      setColorHighlight(next);
                      if (next && displayed.length > 0) {
                        setHighlightAnchorId(displayed[0].id);
                      } else {
                        setHighlightAnchorId(null);
                      }
                    }}
                  >
                    Highlight
                    {colorHighlight && (
                      <span className={playStyles.headerMenuCheck}>✓</span>
                    )}
                  </button>
                </div>
              )}

              <button
                type="button"
                className={playStyles.headerMenuSubmenuTrigger}
                role="menuitem"
                onClick={() =>
                  setExpandedSection((s) =>
                    s === "actions" ? null : "actions",
                  )
                }
              >
                Actions
                <ChevronRight
                  size={16}
                  className={`${playStyles.headerMenuChevron} ${expandedSection === "actions" ? playStyles.headerMenuChevronExpanded : ""}`}
                />
              </button>
              {expandedSection === "actions" && (
                <div className={playStyles.headerMenuNested}>
                  <button
                    type="button"
                    className={playStyles.headerMenuItem}
                    role="menuitem"
                    onClick={shuffleTray}
                    disabled={pieces.length === 0}
                  >
                    Shuffle tray
                  </button>
                  {onClusterModeToggle && (
                    <button
                      type="button"
                      className={playStyles.headerMenuItem}
                      role="menuitem"
                      onClick={onClusterModeToggle}
                    >
                      Cluster
                      {clusterMode && (
                        <span className={playStyles.headerMenuCheck}>✓</span>
                      )}
                    </button>
                  )}
                  {clusterMode &&
                    selectedIds &&
                    selectedIds.size >= 2 &&
                    onCreateCluster && (
                      <button
                        type="button"
                        className={playStyles.headerMenuItem}
                        role="menuitem"
                        onClick={() => onCreateCluster([...selectedIds])}
                      >
                        Create cluster ({selectedIds.size})
                      </button>
                    )}
                </div>
              )}
            </div>,
            document.body,
          )}
      </div>

      {displayed.length > 0 && canScroll && (
        <div
          className={styles.scrollIndicator}
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Scroll position"
        >
          <div
            className={styles.scrollIndicatorFill}
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      )}

      <div className={styles.scrollerWrap}>
        {canScroll && displayed.length > 0 && scrollProgress > 0 && (
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div
          className={`${styles.scroller} ${displayed.length > 0 ? styles.scrollerSnap : ""}`}
          ref={scrollerRef}
          role="list"
        >
        {displayed.length === 0 ? (
          <div className={styles.empty}>{emptyText}</div>
        ) : (
          <div className={styles.row}>
            {displayed.map((p) => {
              const isHighlighted = colorHighlight && highlightedIds.has(p.id);
              const isDimmed =
                colorHighlight && highlightAnchorId != null && !highlightedIds.has(p.id);
              const doScatter = scatterActive && !prefersReducedMotion;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles.pieceButton} ${
                    clusterMode && selectedIds?.has(p.id) ? styles.pieceSelected : ""
                  } ${isHighlighted ? styles.pieceHighlighted : ""} ${
                    isDimmed ? styles.pieceDimmed : ""
                  } ${doScatter ? styles.pieceScatter : ""}`}
                  style={
                    doScatter
                      ? ({
                          "--scatter-rotation": `${scatterVars(p.id).rotation}deg`,
                          "--scatter-dx": `${scatterVars(p.id).dx}px`,
                          "--scatter-dy": `${scatterVars(p.id).dy}px`,
                        } as React.CSSProperties)
                      : undefined
                  }
                  onClick={() => {
                    if (clusterMode && onSelectionToggle) {
                      onSelectionToggle(p.id);
                    } else if (colorHighlight) {
                      setHighlightAnchorId(p.id);
                    } else {
                      onPieceClick(p.id);
                    }
                  }}
                  aria-label={
                    clusterMode
                      ? `Select piece ${p.id}`
                      : colorHighlight
                        ? `Highlight pieces like ${p.id}`
                        : `Place piece ${p.id}`
                  }
                >
                  <div
                    className={styles.thumbWrap}
                    style={{ "--thumb-size": `${thumbSize}px` } as React.CSSProperties}
                  >
                    {image ? (
                      <img
                        className={styles.thumbImg}
                        src={thumbsById.get(p.id)}
                        alt=""
                        draggable={false}
                      />
                    ) : (
                      <div className={styles.thumbFallback} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        </div>
        {canScroll && displayed.length > 0 && scrollProgress < 1 && (
          <button
            type="button"
            className={styles.scrollBtn}
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
});
