import { ChevronRight } from "lucide-react";
import styles from "../PlayScreen.module.css";
import { SUB_MENU_LABELS, SUBMENU_DESCRIPTIONS } from "./headerMenuConstants";
import type { HeaderMenuProps } from "./headerMenuConfig";

interface BaseSectionProps {
  hasSubMenuItems: (id: "contribute" | "help" | "pieceShape" | "modes" | "manualControls" | "effects") => boolean;
  setActiveSubMenu: (
    id: "contribute" | "help" | "pieceShape" | "modes" | "manualControls" | "effects",
  ) => void;
}

export function HeaderMenuAboutSection({
  hasSubMenuItems,
  setActiveSubMenu,
}: BaseSectionProps) {
  return (
    <>
      {hasSubMenuItems("contribute") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("contribute")}
          aria-label="About"
          title="Get involved and meet contributors"
        >
          {SUB_MENU_LABELS.contribute}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {hasSubMenuItems("help") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("help")}
          aria-label="Help"
          title="How to play and keyboard shortcuts"
        >
          {SUB_MENU_LABELS.help}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
    </>
  );
}

export function HeaderMenuControlsSection({
  hasSubMenuItems,
  setActiveSubMenu,
}: BaseSectionProps) {
  return (
    <>
      {hasSubMenuItems("pieceShape") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("pieceShape")}
          aria-label="Piece Shape"
          title="Applies to next puzzle"
        >
          {SUB_MENU_LABELS.pieceShape}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {hasSubMenuItems("modes") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("modes")}
          aria-label="Modes"
          title={SUBMENU_DESCRIPTIONS.modes}
        >
          {SUB_MENU_LABELS.modes}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {hasSubMenuItems("manualControls") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("manualControls")}
          aria-label="Controls"
          title={SUBMENU_DESCRIPTIONS.manualControls}
        >
          {SUB_MENU_LABELS.manualControls}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
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
      />
      <p className={styles.headerMenuRangeHint}>
        Lower = tighter snaps, higher = more forgiving.
      </p>
    </div>
  );
}

export function HeaderMenuDisplaySection({
  hasSubMenuItems,
  setActiveSubMenu,
  onOpenThemeModal,
  setOpen,
}: BaseSectionProps & Pick<HeaderMenuProps, "onOpenThemeModal"> & { setOpen: (open: boolean) => void }) {
  return (
    <>
      {hasSubMenuItems("effects") && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => setActiveSubMenu("effects")}
          aria-label="Effects"
          title={SUBMENU_DESCRIPTIONS.effects}
        >
          {SUB_MENU_LABELS.effects}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
      {onOpenThemeModal && (
        <button
          type="button"
          className={styles.headerMenuSubmenuTrigger}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onOpenThemeModal();
          }}
          aria-label="Theme"
          title="Change color theme"
          data-testid="open-theme-modal"
        >
          {SUB_MENU_LABELS.theme}
          <ChevronRight size={16} className={styles.headerMenuChevron} />
        </button>
      )}
    </>
  );
}
