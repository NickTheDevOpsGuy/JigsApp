/**
 * Alternate ambient music loops for SoundEngine (sounds.ts).
 * Used when Music is toggled in settings and theme is ocean/sunset/space/forest/light/dark.
 * Helpers (playTone, createPadOsc, etc.) are provided by SoundEngine.
 */

export type { SoundsAmbientHelpers } from "./soundsAmbientTypes";
export { createOceanMusic } from "./soundsAmbientOcean";
export { createSunsetMusic } from "./soundsAmbientSunset";
export { createSpaceMusic } from "./soundsAmbientSpace";
export { createForestMusic } from "./soundsAmbientForest";
export { createLightDarkMusic } from "./soundsAmbientLightDark";
