let menuScreenPromise: Promise<typeof import("./Menu/MenuScreen")> | null = null;
let statsScreenPromise: Promise<typeof import("./Stats/StatsScreen")> | null = null;
let packListScreenPromise: Promise<typeof import("./Packs/PackListScreen")> | null = null;
let packDetailScreenPromise: Promise<typeof import("./Packs/PackDetailScreen")> | null =
  null;

export function loadMenuScreenModule() {
  menuScreenPromise ??= import("./Menu/MenuScreen");
  return menuScreenPromise;
}

export function loadStatsScreenModule() {
  statsScreenPromise ??= import("./Stats/StatsScreen");
  return statsScreenPromise;
}

export function loadPackListScreenModule() {
  packListScreenPromise ??= import("./Packs/PackListScreen");
  return packListScreenPromise;
}

export function loadPackDetailScreenModule() {
  packDetailScreenPromise ??= import("./Packs/PackDetailScreen");
  return packDetailScreenPromise;
}
