/**
 * PostHog analytics – who is playing, key events, and stats.
 *
 * Setup:
 * 1. Sign up at https://posthog.com and create a project.
 * 2. In Project Settings, copy "Project API Key" and "Host" (e.g. https://us.i.posthog.com).
 * 3. Add to Vercel: Project → Settings → Environment Variables:
 *    - VITE_POSTHOG_KEY = your Project API Key
 *    - VITE_POSTHOG_HOST = https://us.i.posthog.com (or https://eu.i.posthog.com)
 * 4. View data at https://app.posthog.com (or eu) – log in with your PostHog account.
 *    No route or username/password in the app; the dashboard is PostHog’s cloud UI.
 */

import posthog from "posthog-js";

const key = typeof import.meta.env !== "undefined" && import.meta.env.VITE_POSTHOG_KEY;
const host = typeof import.meta.env !== "undefined" && import.meta.env.VITE_POSTHOG_HOST;

let initialized = false;

export function initPostHog(): void {
  if (typeof window === "undefined" || !key || !host) return;
  try {
    posthog.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: true,
    });
    initialized = true;
  } catch {
    // ignore init errors
  }
}

export function isPostHogReady(): boolean {
  return initialized;
}

/** Identify user when they have an account (e.g. after Supabase auth). Call with null to clear. */
export function identify(userId: string | null, traits?: Record<string, unknown>): void {
  if (!isPostHogReady()) return;
  try {
    if (userId) posthog.identify(userId, traits);
    else posthog.reset();
  } catch {
    // ignore
  }
}

/** Capture a custom event (who is playing, puzzle stats, etc.). */
export function capture(
  event: string,
  properties?: Record<string, unknown>,
): void {
  if (!isPostHogReady()) return;
  try {
    posthog.capture(event, properties);
  } catch {
    // ignore
  }
}
