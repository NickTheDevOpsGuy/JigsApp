const CACHE_TTL_MS = 30_000;

type CacheRecord<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const leaderboardCache = new Map<string, CacheRecord<unknown>>();

export function withLeaderboardCache<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  const cached = leaderboardCache.get(key) as CacheRecord<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.value;

  const value = loader().catch((error) => {
    leaderboardCache.delete(key);
    throw error;
  });

  leaderboardCache.set(key, {
    expiresAt: now + CACHE_TTL_MS,
    value,
  });

  return value;
}
