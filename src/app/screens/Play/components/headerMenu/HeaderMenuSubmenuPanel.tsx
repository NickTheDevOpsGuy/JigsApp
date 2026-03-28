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
  HeaderMenuDisplaySubmenuMerged,
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
  onBack?: () => void;
  backLabel?: string;
};

export function HeaderMenuSubmenuPanel({
  activeSubMenu,
  setActiveSubMenu,
  subMenuItems,
  hasSubMenuItems,
  renderItem,
  headerMenuProps: props,
  setOpen,
  onBack,
  backLabel,
}: Props) {
  const defaultBack = () => {
    const parent = activeSubMenu ? SUBMENU_PARENT[activeSubMenu] : null;
    setActiveSubMenu(parent ?? null);
  };
  const handleBack = onBack ?? defaultBack;

  return (
    <>
      <button
        type="button"
        className={styles.headerMenuBack}
        role="menuitem"
        onClick={handleBack}
        aria-label={backLabel ? `Back to ${backLabel}` : "Back"}
        title={backLabel ? `Back to ${backLabel}` : "Back to main menu"}
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
            <p className={styles.headerMenuSubmenuHint}>{SUBMENU_DESCRIPTIONS.moves}</p>
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
      {activeSubMenu === "display" && (
        <HeaderMenuDisplaySubmenuMerged
          subMenuItems={subMenuItems}
          renderItem={renderItem}
          hasSubMenuItems={hasSubMenuItems}
          setActiveSubMenu={(id) => setActiveSubMenu(id)}
          onOpenThemeModal={props.onOpenThemeModal}
          setOpen={setOpen}
        />
      )}
      {activeSubMenu !== "controls" &&
        activeSubMenu !== "display" &&
        subMenuItems.map((item) => (
          <React.Fragment key={item.id}>{renderItem(item)}</React.Fragment>
        ))}
      {activeSubMenu === "modes" && (
        <HeaderMenuModesRange
          snapToleranceOverride={props.snapToleranceOverride}
          onSnapToleranceOverrideChange={props.onSnapToleranceOverrideChange}
        />
      )}
    </>
  );
}
