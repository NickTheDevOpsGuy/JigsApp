/**
 * Share Result modal content: single Share menu with Copy, Share Card, Download.
 */
import React, { useState, useRef, useEffect } from "react";
import { Copy, Image, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { formatTime } from "../playUtils";
import styles from "../PlayScreen.module.css";

const PLAY_BASE = "https://phuzzle.vercel.app";

interface CompletionSharePopupProps {
  elapsedSeconds: number;
  puzzleShareUrl: string;
  copied?: boolean;
  onCopyResults?: () => void;
  useSeasonalFrame: boolean;
  setUseSeasonalFrame: (v: boolean) => void;
  onShareCard: () => void;
  isGenerating: boolean;
  onDownload: () => void;
}

export function CompletionSharePopup({
  elapsedSeconds,
  puzzleShareUrl,
  copied = false,
  onCopyResults,
  onShareCard,
  isGenerating,
  onDownload,
}: CompletionSharePopupProps) {
  const playUrl = puzzleShareUrl.startsWith("http")
    ? puzzleShareUrl
    : `${PLAY_BASE}${puzzleShareUrl.startsWith("/") ? puzzleShareUrl : `/${puzzleShareUrl}`}`;

  const shareText = `That was ${formatTime(elapsedSeconds)} of focus. Can you do better?\n\n${playUrl}`;

  const canCopy = typeof onCopyResults === "function";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpen]);

  const runAndClose = (fn: () => void) => {
    fn();
    setMenuOpen(false);
  };

  return (
    <div className={styles.shareResultPopup} ref={menuRef}>
      <div className={styles.shareResultPopupMenuWrap}>
        <Button
          variant="secondary"
          onClick={() => setMenuOpen((o) => !o)}
          className={styles.shareResultPopupBtn}
          title="Share options"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          Share
          <ChevronDown
            size={18}
            className={menuOpen ? styles.shareResultPopupChevronOpen : ""}
          />
        </Button>
        {menuOpen && (
          <div className={styles.shareResultPopupMenu} role="menu">
            <button
              type="button"
              role="menuitem"
              className={styles.shareResultPopupMenuItem}
              onClick={() => runAndClose(onCopyResults ?? (() => {}))}
              disabled={!canCopy}
            >
              <Copy size={18} />
              {copied ? "Copied" : "Copy text + link"}
            </button>
            <button
              type="button"
              role="menuitem"
              className={styles.shareResultPopupMenuItem}
              onClick={() => runAndClose(onShareCard)}
              disabled={isGenerating}
            >
              <Image size={18} />
              {isGenerating ? "Generating..." : "Share Card"}
            </button>
            <button
              type="button"
              role="menuitem"
              className={styles.shareResultPopupMenuItem}
              onClick={() => runAndClose(onDownload)}
            >
              <Download size={18} />
              Download
            </button>
          </div>
        )}
      </div>

      <textarea
        readOnly
        value={shareText}
        className={styles.shareResultPopupHiddenText}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
