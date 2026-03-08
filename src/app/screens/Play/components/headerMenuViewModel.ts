import type { MenuItemConfig, SubMenuId } from "./headerMenuConfig";

function sortByLabel(a: MenuItemConfig, b: MenuItemConfig): number {
  return (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
    sensitivity: "base",
  });
}

export function buildHeaderMenuGroups(items: MenuItemConfig[]) {
  const visibleItems = items.filter((i) => i.visible);
  const settingsItems = visibleItems.filter((i) => i.section === "settings").sort(sortByLabel);
  const helpItems = visibleItems.filter((i) => i.section === "help").sort(sortByLabel);
  const aboutItems = visibleItems.filter((i) => i.section === "about").sort(sortByLabel);
  const contributeItems = visibleItems
    .filter((i) => i.section === "contribute")
    .sort(sortByLabel);

  return {
    settingsItems,
    helpItems,
    aboutItems,
    contributeItems,
  };
}

export function getSubMenuItems(params: {
  activeSubMenu: SubMenuId | null;
  settingsItems: MenuItemConfig[];
  helpItems: MenuItemConfig[];
  aboutItems: MenuItemConfig[];
  contributeItems: MenuItemConfig[];
}): MenuItemConfig[] {
  const { activeSubMenu, settingsItems, helpItems, aboutItems, contributeItems } = params;
  if (activeSubMenu === "help") return helpItems;
  if (activeSubMenu === "about") return aboutItems;
  if (activeSubMenu === "contribute") return contributeItems;
  return settingsItems
    .filter((i) => i.subMenu === activeSubMenu)
    .sort((a, b) =>
      (a.sortKey ?? a.label).localeCompare(b.sortKey ?? b.label, undefined, {
        sensitivity: "base",
      }),
    );
}

export function hasSubMenuItems(
  id: SubMenuId,
  groups: {
    settingsItems: MenuItemConfig[];
    helpItems: MenuItemConfig[];
    aboutItems: MenuItemConfig[];
    contributeItems: MenuItemConfig[];
  },
): boolean {
  if (id === "help") return groups.helpItems.length > 0;
  if (id === "about") {
    return (
      groups.aboutItems.length > 0 ||
      groups.contributeItems.length > 0 ||
      groups.helpItems.length > 0
    );
  }
  if (id === "contribute") return groups.contributeItems.length > 0;
  return groups.settingsItems.some((i) => i.subMenu === id);
}

export function getMenuItemAriaLabel(item: MenuItemConfig): string {
  if (item.ariaLabel) return item.ariaLabel;
  return item.sortKey ?? item.label;
}
