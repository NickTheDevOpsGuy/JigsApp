import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/Button/Button";
import { ThemeToggle } from "@/components/ThemeToggle/ThemeToggle";
import styles from "../PlayScreen.module.css";

type DebugFlags = {
  showGrid: boolean;
  showBounds: boolean;
  showIds: boolean;
};

export type HeaderMenuProps = {
  title?: string;
  canUndo: boolean;
  onUndo: () => void;
  showPreview: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  pieceLockingEnabled: boolean;
  showGhostHint: boolean;
  isFullscreen: boolean;
  canShowHaptics: boolean;
  canShowFullscreen: boolean;
  canShowShortcuts: boolean;
  canShowDebug: boolean;
  debug: DebugFlags;
  onNewPuzzle: () => void;
  onTogglePreview: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
  onTogglePieceLocking: () => void;
  onToggleGhostHint: () => void;
  onToggleFullscreen: () => void;
  onShowShortcuts: () => void;
  onShowHowToPlay: () => void;
  onToggleDebug: () => void;
};

type MenuItemConfig = {
  id: string;
  label: string;
  section: "nav" | "settings" | "help" | "other";
  visible: boolean;
  disabled?: boolean;
  onClick: () => void;
  isTheme?: boolean;
};

function useMenuItems(
  props: HeaderMenuProps,
  setOpen: (open: boolean) => void,
): MenuItemConfig[] {
  const navigate = useNavigate();

  const closeAnd = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };

  return [
    {
      id: "home",
      section: "nav",
      visible: true,
      label: "Home",
      onClick: closeAnd(() => navigate("/")),
    },
    {
      id: "new",
      section: "nav",
      visible: true,
      label: "New puzzle",
      onClick: closeAnd(props.onNewPuzzle),
    },
    {
      id: "undo",
      section: "nav",
      visible: true,
      label: "Undo",
      disabled: !props.canUndo,
      onClick: closeAnd(props.onUndo),
    },
    {
      id: "debug",
      section: "settings",
      visible: props.canShowDebug,
      label: "Debug overlay",
      onClick: closeAnd(props.onToggleDebug),
    },
    {
      id: "fullscreen",
      section: "settings",
      visible: props.canShowFullscreen,
      label: props.isFullscreen ? "Exit fullscreen" : "Fullscreen",
      onClick: closeAnd(props.onToggleFullscreen),
    },
    {
      id: "ghost",
      section: "settings",
      visible: true,
      label: props.showGhostHint ? "Ghost hint: on" : "Ghost hint: off",
      onClick: closeAnd(props.onToggleGhostHint),
    },
    {
      id: "haptics",
      section: "settings",
      visible: props.canShowHaptics,
      label: props.hapticsEnabled ? "Haptics: on" : "Haptics: off",
      onClick: closeAnd(props.onToggleHaptics),
    },
    {
      id: "howto",
      section: "help",
      visible: true,
      label: "How to Play",
      onClick: closeAnd(props.onShowHowToPlay),
    },
    {
      id: "shortcuts",
      section: "help",
      visible: props.canShowShortcuts,
      label: "Keyboard shortcuts",
      onClick: closeAnd(props.onShowShortcuts),
    },
    {
      id: "theme",
      section: "other",
      visible: true,
      label: "",
      onClick: () => setOpen(false),
      isTheme: true,
    },
    {
      id: "lock",
      section: "other",
      visible: true,
      label: props.pieceLockingEnabled ? "Lock pieces: on" : "Lock pieces: off",
      onClick: closeAnd(props.onTogglePieceLocking),
    },
    {
      id: "preview",
      section: "other",
      visible: true,
      label: props.showPreview ? "Hide preview" : "Show preview",
      onClick: closeAnd(props.onTogglePreview),
    },
    {
      id: "sound",
      section: "other",
      visible: true,
      label: props.soundEnabled ? "Sound: on" : "Sound: off",
      onClick: closeAnd(props.onToggleSound),
    },
  ];
}

/**
 * Single source of truth for the "hamburger" menu.
 * Config-driven to reduce repetition and keep UI consistent.
 */
export function HeaderMenu(props: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const items = useMenuItems(props, setOpen);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el || (e.target && el.contains(e.target as Node))) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const visibleItems = items.filter((i) => i.visible);
  const navItems = visibleItems.filter((i) => i.section === "nav");
  const settingsItems = visibleItems.filter((i) => i.section === "settings");
  const helpItems = visibleItems.filter((i) => i.section === "help");
  const otherItems = visibleItems.filter((i) => i.section === "other");

  const renderItem = (item: MenuItemConfig) => {
    if (item.isTheme) {
      return (
        <div
          key={item.id}
          className={styles.headerMenuToggle}
          role="menuitem"
          onClick={item.onClick}
        >
          <ThemeToggle variant="menuItem" />
        </div>
      );
    }
    return (
      <button
        key={item.id}
        className={styles.headerMenuItem}
        role="menuitem"
        disabled={item.disabled}
        onClick={item.onClick}
      >
        {item.label}
      </button>
    );
  };

  return (
    <div className={styles.headerMenuWrap} ref={rootRef}>
      <Button
        size="sm"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        <Menu size={16} />
        <span className={styles.btnText}>Menu</span>
      </Button>

      {open && (
        <div className={styles.headerMenuPanel} role="menu">
          {navItems.map(renderItem)}
          <div className={styles.headerMenuDivider} />
          <div className={styles.headerMenuSection}>Settings</div>
          {settingsItems.map(renderItem)}
          <div className={styles.headerMenuDivider} />
          <div className={styles.headerMenuSection}>Help</div>
          {helpItems.map(renderItem)}
          {otherItems.map(renderItem)}
        </div>
      )}
    </div>
  );
}
