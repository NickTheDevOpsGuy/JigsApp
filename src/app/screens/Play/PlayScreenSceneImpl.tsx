import { soundManager } from "@/audio/sounds";
import { getToleranceMultiplier } from "@/services/adaptiveDifficultyService";

import { PlayScreenLayout } from "./components";
import { usePlayScreenPrimarySetup } from "./playScreenScenePrimarySetup";
import { usePlayScreenBehavior } from "./playScreenSceneBehavior";
import { usePlayScreenInteractions } from "./playScreenSceneInteractions";
import { usePlayScreenLayout } from "./playScreenSceneLayout";

export function PlayScreen() {
  const setup = usePlayScreenPrimarySetup();
  const behavior = usePlayScreenBehavior({ ...setup, getToleranceMultiplier });
  const interactions = usePlayScreenInteractions({ setup, behavior });

  const layoutProps = usePlayScreenLayout({
    setup,
    behavior,
    interactions,
    soundPlay: soundManager.play.bind(soundManager),
  });

  return <PlayScreenLayout {...layoutProps} />;
}

export default PlayScreen;
