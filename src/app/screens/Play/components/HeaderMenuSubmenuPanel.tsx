/**
 * HeaderMenu submenu panel: back button, submenu heading, and item list (including modes snap range, display/theme).
 */
import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../PlayScreen.module.css";
import {
  SUB_MENU_LABELS,
  SUBMENU_PARENT,
  SUBMENU_DESCRIPTIONS,
} from "./headerMenuConstants";
import type { MenuItemConfig, SubMenuId } from "./headerMenuConfig";
import type { HeaderMenuProps } from "./headerMenuConfig";

type Props = {
  activeSubMenu: SubMenuId | null;
  setActiveSubMenu: (id: SubMenuId | null) => void;
  subMenuItems: MenuItemConfig[];
  hasSubMenuItems: (id: SubMenuId) => boolean;
  renderItem: (item: MenuItemConfig) => React.ReactNode;
  headerMenuProps: HeaderMenuProps;
  setOpen: (open: boolean) => void;
};

export function HeaderMenuSubmenuPanel({
  activeSubMenu,
  setActiveSubMenu,
  subMenuItems,
  hasSubMenuItems,
  renderItem,
  headerMenuProps: props,
  setOpen,
}: Props) {
  const handleBack = () => {
    const parent = activeSubMenu ? SUBMENU_PARENT[activeSubMenu] : null;
    setActiveSubMenu(parent ?? null);
  };

  return (
    <>
      <button
        type="button"
        className={styles.headerMenuBack}
        role="menuitem"
        onClick={handleBack}
        aria-label="Back"
        title="Back to main menu"
      >
        <ChevronLeft size={16} />
        Back
      </button>
      <div className={styles.headerMenuDivider} />
      {activeSubMenu && activeSubMenu !== "about" && (
        <div className={styles.headerMenuSubmenuHeadingWrap}>
          <h3 className={styles.headerMenuSubmenuHeading}>
            {SUB_MENU_LABELS[activeSubMenu]}
          </h3>
          {activeSubMenu === "pieceShape" && (
            <p className={styles.headerMenuSubmenuHint}>
              {SUBMENU_DESCRIPTIONS.pieceShape}
            </p>
          )}
        </div>
      )}
      {activeSubMenu === "about" && (
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
      )}
      {activeSubMenu === "controls" && (
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
      )}
      {activeSubMenu !== "controls" &&
        subMenuItems.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      {activeSubMenu === "modes" && (
        <div className={styles.headerMenuRangeWrap}>
          <label
            htmlFor="snap-tolerance-range"
            className={styles.headerMenuRangeLabel}
            title="Adjust how forgiving piece snapping is"
          >
            Snap Assist: {Math.round(props.snapToleranceOverride * 100)}%
          </label>
          <input
            id="snap-tolerance-range"
            type="range"
            min={60}
            max={160}
            step={5}
            value={Math.round(props.snapToleranceOverride * 100)}
            onChange={(e) =>
              props.onSnapToleranceOverrideChange(Number(e.target.value) / 100)
            }
            className={styles.headerMenuRange}
            aria-label="Snap tolerance override"
          />
          <p className={styles.headerMenuRangeHint}>
            Lower = tighter snaps, higher = more forgiving.
          </p>
        </div>
      )}
      {activeSubMenu === "display" && (
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
          {props.onOpenThemeModal && (
            <button
              type="button"
              className={styles.headerMenuSubmenuTrigger}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                props.onOpenThemeModal!();
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
      )}
    </>
  );
}
