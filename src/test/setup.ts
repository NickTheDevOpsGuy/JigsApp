/**
 * Vitest setup – suppress known benign warnings (e.g. happy-dom localStorage).
 */
const originalEmit = process.emit;
process.emit = function (name: string, data: unknown, ...args: unknown[]): boolean {
  if (
    name === "warning" &&
    typeof data === "object" &&
    data !== null &&
    "message" in data &&
    typeof (data as { message?: string }).message === "string" &&
    (data as { message: string }).message.includes("localstorage-file")
  ) {
    return false; // suppress: do not propagate to default handler
  }
  return (originalEmit as NodeJS.Process["emit"]).apply(this, [name, data, ...args] as [
    string,
    unknown,
    ...unknown[],
  ]);
};
