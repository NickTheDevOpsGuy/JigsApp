import { useEffect, useRef, useState } from "react";

export function useCompletionOverlayMenus() {
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const shareTriggerRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  const [replayNextMenuOpen, setReplayNextMenuOpen] = useState(false);
  const replayNextRef = useRef<HTMLDivElement>(null);
  const replayNextTriggerRef = useRef<HTMLButtonElement>(null);
  const [replayNextDropdownPosition, setReplayNextDropdownPosition] = useState<{
    top: number;
    left: number;
    minWidth: number;
  } | null>(null);

  useEffect(() => {
    if (!shareMenuOpen || !shareTriggerRef.current) {
      setDropdownPosition(null);
      return;
    }
    const rect = shareTriggerRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: rect.width,
    });
  }, [shareMenuOpen]);

  useEffect(() => {
    if (!replayNextMenuOpen || !replayNextTriggerRef.current) {
      setReplayNextDropdownPosition(null);
      return;
    }
    const rect = replayNextTriggerRef.current.getBoundingClientRect();
    setReplayNextDropdownPosition({
      top: rect.bottom + 6,
      left: rect.left,
      minWidth: rect.width,
    });
  }, [replayNextMenuOpen]);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = shareRef.current?.contains(target);
      const inDropdown = (target as Element).closest?.("[data-complete-share-dropdown]");
      if (!inTrigger && !inDropdown) setShareMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [shareMenuOpen]);

  useEffect(() => {
    if (!replayNextMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      const inTrigger = replayNextRef.current?.contains(target);
      const inDropdown = (target as Element).closest?.(
        "[data-complete-replay-next-dropdown]",
      );
      if (!inTrigger && !inDropdown) setReplayNextMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [replayNextMenuOpen]);

  return {
    shareMenuOpen,
    setShareMenuOpen,
    shareRef,
    shareTriggerRef,
    dropdownPosition,
    replayNextMenuOpen,
    setReplayNextMenuOpen,
    replayNextRef,
    replayNextTriggerRef,
    replayNextDropdownPosition,
  };
}
