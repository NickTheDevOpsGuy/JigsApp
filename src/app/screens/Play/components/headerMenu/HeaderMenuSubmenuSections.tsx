import React from "react";
import { ChevronRight } from "lucide-react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import {
  SUB_MENU_LABELS,
  SUBMENU_DESCRIPTIONS,
} from "@/screens/Play/components/headerMenu/headerMenuConstants";
import type {
  HeaderMenuProps,
  MenuItemConfig,
} from "@/screens/Play/components/headerMenu/headerMenuConfig";

interface BaseSectionProps {
  hasSubMenuItems: (
    id:
      | "contribute"
      | "help"
      | "pieceShape"
      | "modes"
      | "manualControls"
      | "moves"
      | "effects",
  ) => boolean;
  setActiveSubMenu: (
    id:
      | "contribute"
      | "help"
      | "pieceShape"
      | "modes"
      | "manualControls"
      | "moves"
      | "effects",
  ) => void;
}

export function HeaderMenuAboutSection({
  hasSubMenuItems,
  setActiveSubMenu,
}: BaseSectionProps) {
  type Row = { key: string; label: string; node: React.ReactNode };
  const rows: Row[] = [];
  if (hasSubMenuItems("contribute")) {
    rows.push({
      key: "contribute",
      label: SUB_MENU_LABELS.contribute,
      node: (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("contribute")}
          aria-label={SUB_MENU_LABELS.contribute}
          title="Get involved and meet contributors"
        >
          {SUB_MENU_LABELS.contribute}
          <ChevronRight size={16} className={styles.headerMenuChevron} aria-hidden />
        </button>
      ),
    });
  }
  if (hasSubMenuItems("help")) {
    rows.push({
      key: "help",
      label: SUB_MENU_LABELS.help,
      node: (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("help")}
          aria-label={SUB_MENU_LABELS.help}
          title="How to play and keyboard shortcuts"
        >
          {SUB_MENU_LABELS.help}
          <ChevronRight size={16} className={styles.headerMenuChevron} aria-hidden />
        </button>
      ),
    });
  }
  rows.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return (
    <>
      {rows.map((r) => (
        <React.Fragment key={r.key}>{r.node}</React.Fragment>
      ))}
    </>
  );
}

const CONTROLS_SUBMENU_IDS = ["manualControls", "modes", "moves", "pieceShape"] as const;

export function HeaderMenuControlsSection({
  hasSubMenuItems,
  setActiveSubMenu,
}: BaseSectionProps) {
  const orderedIds = CONTROLS_SUBMENU_IDS.filter((id) => hasSubMenuItems(id)).sort(
    (a, b) =>
      SUB_MENU_LABELS[a].localeCompare(SUB_MENU_LABELS[b], undefined, {
        sensitivity: "base",
      }),
  );

  return (
    <>
      {orderedIds.map((id) => (
        <button
          key={id}
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu(id)}
          aria-label={SUB_MENU_LABELS[id]}
          title={
            id === "pieceShape"
              ? "Applies to next puzzle"
              : SUBMENU_DESCRIPTIONS[id as keyof typeof SUBMENU_DESCRIPTIONS]
          }
        >
          {SUB_MENU_LABELS[id]}
          <ChevronRight size={16} className={styles.headerMenuChevron} aria-hidden />
        </button>
      ))}
    </>
  );
}

export function HeaderMenuModesRange({
  snapToleranceOverride,
  onSnapToleranceOverrideChange,
}: Pick<HeaderMenuProps, "snapToleranceOverride" | "onSnapToleranceOverrideChange">) {
  return (
    <div className={styles.headerMenuRangeWrap}>
      <label
        htmlFor="snap-tolerance-range"
        className={styles.headerMenuRangeLabel}
        title="Adjust how forgiving piece snapping is"
      >
        Snap Assist: {Math.round(snapToleranceOverride * 100)}%
      </label>
      <input
        id="snap-tolerance-range"
        type="range"
        min={60}
        max={160}
        step={5}
        value={Math.round(snapToleranceOverride * 100)}
        onChange={(e) => onSnapToleranceOverrideChange(Number(e.target.value) / 100)}
        className={styles.headerMenuRange}
        aria-label="Snap tolerance override"
        title="Adjust how forgiving piece snapping is (60%–160%)"
      />
      <p className={styles.headerMenuRangeHint}>
        Lower = tighter snaps, higher = more forgiving.
      </p>
    </div>
  );
}

/**
 * Appearance submenu: toggles + Effects + Theme drill-ins, single A–Z list by label.
 */
export function HeaderMenuDisplaySubmenuMerged({
  subMenuItems,
  renderItem,
  hasSubMenuItems,
  setActiveSubMenu,
  onOpenThemeModal,
  setOpen,
}: BaseSectionProps &
  Pick<HeaderMenuProps, "onOpenThemeModal"> & {
    subMenuItems: MenuItemConfig[];
    renderItem: (item: MenuItemConfig) => React.ReactNode;
    setOpen: (open: boolean) => void;
  }) {
  type Row = { key: string; label: string; node: React.ReactNode };
  const rows: Row[] = subMenuItems.map((item) => ({
    key: item.id,
    label: item.sortKey ?? item.label,
    node: renderItem(item),
  }));
  if (hasSubMenuItems("effects")) {
    rows.push({
      key: "effects",
      label: SUB_MENU_LABELS.effects,
      node: (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("effects")}
          aria-label={SUB_MENU_LABELS.effects}
          title={SUBMENU_DESCRIPTIONS.effects}
        >
          {SUB_MENU_LABELS.effects}
          <ChevronRight size={16} className={styles.headerMenuChevron} aria-hidden />
        </button>
      ),
    });
  }
  if (onOpenThemeModal) {
    rows.push({
      key: "theme",
      label: SUB_MENU_LABELS.theme,
      node: (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onOpenThemeModal();
          }}
          aria-label={SUB_MENU_LABELS.theme}
          title="Change color theme"
          data-testid="open-theme-modal"
        >
          {SUB_MENU_LABELS.theme}
          <ChevronRight size={16} className={styles.headerMenuChevron} aria-hidden />
        </button>
      ),
    });
  }
  rows.sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return (
    <>
      {rows.map((row) => (
        <React.Fragment key={row.key}>{row.node}</React.Fragment>
      ))}
    </>
  );
}
