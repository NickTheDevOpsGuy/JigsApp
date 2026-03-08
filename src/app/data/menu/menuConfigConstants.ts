/**
 * menuConfigConstants – types and labels for menu tree (used by menuConfig.ts).
 */

export const TIME_MODE_LABELS: Record<string, string> = {
  elapsed: "Elapsed",
  countdown: "Countdown",
  active: "Active only",
  relaxed: "Relaxed (no timer)",
  best: "Best time",
};

export type MenuNode =
  | {
      type: "folder";
      id: string;
      label: string;
      children: MenuNode[];
      collapsible?: boolean;
    }
  | { type: "action"; id: string; label: string }
  | { type: "theme"; id: string }
  | { type: "toggle"; id: string; label: string; getLabel?: (on: boolean) => string }
  | { type: "navigate"; id: string; label: string; path: string }
  | { type: "custom"; id: string; render: "theme" | "divider" };
