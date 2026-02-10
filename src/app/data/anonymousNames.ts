/**
 * Fun raccoon-themed names for anonymous leaderboard players.
 * Same user_id always gets the same name (deterministic).
 */

export const ANONYMOUS_RACCOON_TERMS = [
  "Anonymous Raccoon",
  "Feral Raccoon",
  "Trash Eater",
  "Midnight Bandit",
  "Bin Diver",
  "Rascal Raccoon",
  "Garbage Goblin",
  "Dumpster Diver",
  "Bandit Mask",
  "Coonskin Cap",
  "Night Raider",
  "Paw Pilferer",
  "Trash Panda",
  "Backyard Bandit",
  "Sly Raccoon",
  "Curbside Critter",
] as const;

/** Simple numeric hash of a string for deterministic anonymous names. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Return a deterministic, fun display name for an anonymous user.
 * Same userId always gets the same name (e.g. "Trash Eater 42").
 */
export function getAnonymousDisplayName(userId: string): string {
  const h = hashString(userId);
  const term = ANONYMOUS_RACCOON_TERMS[h % ANONYMOUS_RACCOON_TERMS.length];
  const num = (h % 9998) + 1; // 1–9999 so it's friendly
  return `${term} ${num}`;
}
