/** Limited-time puzzle events (Halloween, Winter, etc.). */
export type PuzzleEvent = {
  id: string;
  name: string;
  slug: string;
  startDate: string;
  endDate: string;
  badgeId?: string;
};

export const PUZZLE_EVENTS: PuzzleEvent[] = [
  {
    id: "halloween-2025",
    name: "Halloween Pack",
    slug: "halloween-2025",
    startDate: "2025-10-25",
    endDate: "2025-11-01",
    badgeId: "halloween-badge",
  },
  {
    id: "winter-2025",
    name: "Winter Event",
    slug: "winter-2025",
    startDate: "2025-12-15",
    endDate: "2026-01-05",
    badgeId: "winter-badge",
  },
];

export function getActiveEvent(): PuzzleEvent | null {
  const now = new Date().toISOString().slice(0, 10);
  return PUZZLE_EVENTS.find((e) => e.startDate <= now && e.endDate >= now) ?? null;
}
