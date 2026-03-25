import type { SoundType } from "@/audio/core/sounds";
import type { usePlayScreenPrimarySetup } from "./playScreenScenePrimarySetup";
import type { usePlayScreenBehavior } from "./playScreenSceneBehavior";
import type { usePlayScreenInteractions } from "./playScreenSceneInteractions";

/** Bundle passed from `PlayScreenSceneImpl` into `usePlayScreenLayout` and layout helpers. */
export type PlayScreenSceneLayoutContext = {
  setup: ReturnType<typeof usePlayScreenPrimarySetup>;
  behavior: ReturnType<typeof usePlayScreenBehavior>;
  interactions: ReturnType<typeof usePlayScreenInteractions>;
  soundPlay: (
    sound: SoundType,
    opts?: { groupSize?: number; proximity?: number },
  ) => void;
};
