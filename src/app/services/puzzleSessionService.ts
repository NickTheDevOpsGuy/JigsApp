import { supabase, isSupabaseConfigured } from "@/supabase/client";
import type { GridSize } from "@/puzzle/types";
import type { SavedPiece } from "@/puzzle/puzzleStorage";

export type PuzzleSessionState = {
  pieces: SavedPiece[];
  elapsedSeconds: number;
  isComplete: boolean;
};

export type PuzzleSession = {
  id: string;
  imageUrl: string;
  grid: GridSize;
  state: PuzzleSessionState;
  createdAt: string;
  updatedAt: string;
};

/**
 * Create a new collaborative puzzle session.
 * Pass current state to initialize (e.g. pieces, elapsedSeconds).
 * Returns session ID for the shareable link.
 */
export async function createPuzzleSession(
  imageUrl: string,
  grid: GridSize,
  state: PuzzleSessionState,
): Promise<{ sessionId: string } | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const fullImageUrl =
    imageUrl.startsWith("data:") || imageUrl.startsWith("http")
      ? imageUrl
      : new URL(imageUrl, window.location.origin).href;

  const { data, error } = await supabase
    .from("puzzle_sessions")
    .insert({
      image_url: fullImageUrl,
      grid_rows: grid.rows,
      grid_cols: grid.cols,
      state_json: state,
      elapsed_seconds: state.elapsedSeconds,
      is_complete: state.isComplete,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("Failed to create puzzle session:", error);
    return null;
  }
  return { sessionId: data.id };
}

/**
 * Fetch session by ID (for joining via share link).
 */
export async function getPuzzleSession(
  sessionId: string,
): Promise<PuzzleSession | null> {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await supabase
    .from("puzzle_sessions")
    .select("id, image_url, grid_rows, grid_cols, state_json, elapsed_seconds, is_complete, created_at, updated_at")
    .eq("id", sessionId)
    .single();

  if (error || !data) return null;

  const state = data.state_json as PuzzleSessionState;
  const row = data as Record<string, unknown>;
  return {
    id: data.id,
    imageUrl: data.image_url,
    grid: { rows: data.grid_rows, cols: data.grid_cols },
    state: {
      pieces: state?.pieces ?? [],
      elapsedSeconds: (row.elapsed_seconds as number) ?? state?.elapsedSeconds ?? 0,
      isComplete: (row.is_complete as boolean) ?? state?.isComplete ?? false,
    },
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update session state (push local changes to server).
 */
export async function updatePuzzleSession(
  sessionId: string,
  state: PuzzleSessionState,
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;

  const { error } = await supabase
    .from("puzzle_sessions")
    .update({
      state_json: state,
      elapsed_seconds: state.elapsedSeconds,
      is_complete: state.isComplete,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    console.warn("Failed to update puzzle session:", error);
    return false;
  }
  return true;
}

export type SubscribeResult = {
  unsubscribe: () => void;
  setPresence: (data: Record<string, unknown>) => void;
};

/**
 * Subscribe to session changes (Realtime) and presence.
 * - onUpdate: when another participant pushes state
 * - onPresenceChange: when connected players count changes
 */
export function subscribePuzzleSession(
  sessionId: string,
  onUpdate: (state: PuzzleSessionState) => void,
  onPresenceChange?: (count: number) => void,
): SubscribeResult {
  if (!isSupabaseConfigured() || !supabase) {
    return { unsubscribe: () => {}, setPresence: () => {} };
  }

  const channelName = `puzzle:${sessionId}`;
  const channel = supabase.channel(channelName);

  channel.on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "puzzle_sessions",
      filter: `id=eq.${sessionId}`,
    },
    (payload) => {
      const newRow = payload.new as Record<string, unknown>;
      if (newRow?.state_json) {
        const state = newRow.state_json as PuzzleSessionState;
        onUpdate(state);
      }
    },
  );

  if (onPresenceChange) {
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const count = Object.values(state).flat().length;
      onPresenceChange(count);
    });
  }

  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({ joined_at: Date.now() });
    }
  });

  return {
    unsubscribe: () => supabase!.removeChannel(channel),
    setPresence: (data) => channel.track(data),
  };
}
