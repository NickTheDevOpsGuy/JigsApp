/**
 * logger – centralized app logging with runtime level control.
 *
 * Level precedence:
 * 1) `?logLevel=debug|info|warn|error` query param
 * 2) localStorage `phuzzle:logLevel`
 * 3) default: `info` in dev, `warn` in prod
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_KEY = "phuzzle:logLevel";
const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function parseLogLevel(value: string | null): LogLevel | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return null;
}

function getConfiguredLevel(): LogLevel {
  try {
    if (typeof window !== "undefined" && window.location?.search) {
      const fromQuery = parseLogLevel(
        new URLSearchParams(window.location.search).get("logLevel"),
      );
      if (fromQuery) return fromQuery;
    }
  } catch {
    // ignore
  }

  try {
    if (typeof localStorage !== "undefined") {
      const fromStorage = parseLogLevel(localStorage.getItem(LOG_LEVEL_KEY));
      if (fromStorage) return fromStorage;
    }
  } catch {
    // ignore
  }

  return import.meta.env.DEV ? "info" : "warn";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[getConfiguredLevel()];
}

function write(level: LogLevel, ...args: unknown[]): void {
  if (!shouldLog(level)) return;
  const prefix = `[phuzzle:${level}]`;
  if (level === "debug" || level === "info") {
    // eslint-disable-next-line no-console
    console.info(prefix, ...args);
    return;
  }
  if (level === "warn") {
    console.warn(prefix, ...args);
    return;
  }
  console.error(prefix, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => write("debug", ...args),
  info: (...args: unknown[]) => write("info", ...args),
  warn: (...args: unknown[]) => write("warn", ...args),
  error: (...args: unknown[]) => write("error", ...args),
};
