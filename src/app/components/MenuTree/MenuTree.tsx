/**
 * MenuTree – hierarchical expandable menu.
 */
import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { MenuNode } from "@/data/menuConfig";
import { getMenuTree } from "@/data/menuConfig";
import styles from "./MenuTree.module.css";

export type MenuActionHandler = (node: MenuNode, path: string[]) => void | Promise<void>;

/** IDs of menu items that only make sense when a puzzle is active (play context). */
const PLAY_ONLY_IDS = new Set([
  "centerBoard",
  "showPreview",
  "pieceLocking",
  "ghostHint",
  "ghostWhenIdle",
  "timeModeQuick",
  "time-elapsed",
  "time-countdown",
  "time-active",
  "time-relaxed",
  "time-timeAttack",
  "time-timeDecay",
  "shareCompletion",
  "playWithFriend",
]);

export type MenuTreeProps = {
  onAction: MenuActionHandler;
  getToggleState?: (id: string) => boolean;
  getTheme?: () => string;
  /** When "home", hide items that require play context (e.g. Undo, Redo, Center Board) */
  context?: "home" | "play";
  /** Root nodes to show (default: full tree) */
  rootIds?: string[];
};

function hasChildren(node: MenuNode): node is MenuNode & { children: MenuNode[] } {
  return node.type === "folder" && "children" in node && node.children.length > 0;
}

function getDisplayLabel(
  node: MenuNode,
  getToggleState?: (id: string) => boolean,
  getTheme?: () => string,
): string {
  if (node.type === "toggle" && node.getLabel && getToggleState) {
    return node.getLabel(getToggleState(node.id));
  }
  if (node.type === "action" || node.type === "navigate") {
    return node.label;
  }
  if (node.type === "folder") {
    return node.label;
  }
  if (node.type === "theme" && getTheme) {
    return getTheme();
  }
  return "";
}

function filterPlayOnly(nodes: MenuNode[], context: "home" | "play"): MenuNode[] {
  if (context === "play") return nodes;
  return nodes
    .filter((n) => !PLAY_ONLY_IDS.has(n.id))
    .map((n) =>
      hasChildren(n) ? { ...n, children: filterPlayOnly(n.children, context) } : n,
    )
    .filter((n) => {
      if (hasChildren(n)) return n.children.length > 0;
      return true;
    });
}

export function MenuTree({
  onAction,
  getToggleState,
  getTheme,
  context = "home",
  rootIds,
}: MenuTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["play"]));
  const tree = filterPlayOnly(getMenuTree(), context);
  const roots = rootIds
    ? tree.filter((n) => n.type === "folder" && rootIds.includes(n.id))
    : tree;

  const toggleExpand = (id: string) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNodeClick = (node: MenuNode, path: string[]) => {
    if (hasChildren(node)) {
      toggleExpand(node.id);
    } else {
      onAction(node, path);
    }
  };

  const renderNode = (node: MenuNode, depth: number, path: string[]): React.ReactNode => {
    const currentPath = [...path, node.id];
    const isFolder = hasChildren(node);
    const isExp = isFolder && expanded.has(node.id);

    if (node.type === "theme") {
      return null;
    }

    const label = getDisplayLabel(node, getToggleState, getTheme);

    return (
      <div key={node.id} className={styles.node} data-depth={depth}>
        <button
          type="button"
          className={`${styles.nodeButton} ${isFolder ? styles.folder : styles.leaf} ${isFolder && isExp ? styles.nodeButtonExpanded : ""}`}
          onClick={() => handleNodeClick(node, currentPath)}
          aria-expanded={isFolder ? isExp : undefined}
        >
          {isFolder && (
            <span className={styles.chevron}>
              {isExp ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          <span className={styles.label}>{label}</span>
        </button>
        {isFolder && isExp && (
          <div className={styles.children}>
            {node.children.map((child) => renderNode(child, depth + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className={styles.tree} role="tree" aria-label="Main menu">
      {roots.map((node) => renderNode(node, 0, []))}
    </nav>
  );
}
