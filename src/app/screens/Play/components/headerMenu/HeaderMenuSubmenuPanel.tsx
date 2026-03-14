/**
 * HeaderMenu submenu panel: back button, submenu heading, and item list (including modes snap range, display/theme).
 */
import React from "react";
import { ChevronLeft } from "lucide-react";
import styles from "@/screens/Play/styles/PlayScreen.module.css";
import {
  SUB_MENU_LABELS,
  SUBMENU_PARENT,
  SUBMENU_DESCRIPTIONS,
} from "@/screens/Play/components/headerMenu/headerMenuConstants";
import type {
  MenuItemConfig,
  SubMenuId,
} from "@/screens/Play/components/headerMenu/headerMenuConfig";
import type { HeaderMenuProps } from "@/screens/Play/components/headerMenu/headerMenuConfig";
import {
  HeaderMenuAboutSection,
  HeaderMenuControlsSection,
  HeaderMenuDisplaySection,
  HeaderMenuModesRange,
} from "@/screens/Play/components/headerMenu/HeaderMenuSubmenuSections";

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
          {activeSubMenu === "moves" && (
            <p className={styles.headerMenuSubmenuHint}>
              {SUBMENU_DESCRIPTIONS.moves}
            </p>
          )}
        </div>
      )}
      {activeSubMenu === "about" && (
        <HeaderMenuAboutSection
          hasSubMenuItems={hasSubMenuItems}
          setActiveSubMenu={(id) => setActiveSubMenu(id)}
        />
      )}
      {activeSubMenu === "controls" && (
        <HeaderMenuControlsSection
          hasSubMenuItems={hasSubMenuItems}
          setActiveSubMenu={(id) => setActiveSubMenu(id)}
        />
      )}
      {activeSubMenu !== "controls" &&
        subMenuItems.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      {activeSubMenu === "modes" && (
        <HeaderMenuModesRange
          snapToleranceOverride={props.snapToleranceOverride}
          onSnapToleranceOverrideChange={props.onSnapToleranceOverrideChange}
        />
      )}
      {activeSubMenu === "display" && (
        <HeaderMenuDisplaySection
          hasSubMenuItems={hasSubMenuItems}
          setActiveSubMenu={(id) => setActiveSubMenu(id)}
          onOpenThemeModal={props.onOpenThemeModal}
          setOpen={setOpen}
        />
      )}
    </>
  );
}
