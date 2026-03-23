let playScreenPromise: Promise<typeof import("./PlayScreen")> | null = null;

export function loadPlayScreenModule() {
  playScreenPromise ??= import("./PlayScreen");
  return playScreenPromise;
}
