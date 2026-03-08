/**
 * Server time – fetch UTC now from Supabase for countdown sync.
 * Falls back to client time if Supabase unavailable.
 */
import { supabase } from "@/supabase/client";

let serverOffsetMs: number | null = null;

/** Fetch server UTC timestamp and compute offset from client. */
export async function syncServerTime(): Promise<Date> {
  const clientBefore = Date.now();
  try {
    if (!supabase) return new Date();
    const result = await supabase.rpc("get_server_utc_now");
    const { data, error } = result;
    if (error || data == null) return new Date();
    const serverUtc = new Date(data);
    const clientAfter = Date.now();
    const roundTrip = (clientAfter - clientBefore) / 2;
    const estimatedServer = clientBefore + roundTrip;
    serverOffsetMs = serverUtc.getTime() - estimatedServer;
    return serverUtc;
  } catch {
    return new Date();
  }
}

/** Get current time adjusted by server offset (or client if not synced). */
export function getSyncedNow(): Date {
  if (serverOffsetMs != null) {
    return new Date(Date.now() + serverOffsetMs);
  }
  return new Date();
}

/** Seconds until next UTC midnight (getTime is already UTC). */
export function getSecondsUntilNextUtcMidnight(now: Date): number {
  const secsIntoDay = (now.getTime() / 1000) % 86400;
  return Math.ceil(86400 - secsIntoDay);
}
