/**
 * Theme-specific procedural music for audioManager.
 * Each creator returns { stop } and uses playVoice + humanize from the manager.
 */
export type { PlayVoiceHelpers } from "./audioManagerThemesTypes";
export { createOceanMusic } from "./audioManagerThemeOcean";
export { createForestMusic } from "./audioManagerThemeForest";
export { createSpaceMusic } from "./audioManagerThemeSpace";
export { createSunsetMusic } from "./audioManagerThemeSunset";
export { createLightDarkMusic } from "./audioManagerThemeLightDark";
