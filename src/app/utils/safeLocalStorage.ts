/**
 * Safe localStorage wrapper. Use everywhere instead of raw localStorage so that
 * private/incognito or full storage doesn't throw and break the app.
 */
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },

  /** Number of keys (for iteration). Returns 0 if unavailable. */
  get length(): number {
    try {
      return localStorage.length;
    } catch {
      return 0;
    }
  },

  /** Key at index (for iteration). Returns null if unavailable. */
  key(index: number): string | null {
    try {
      return localStorage.key(index);
    } catch {
      return null;
    }
  },
};
