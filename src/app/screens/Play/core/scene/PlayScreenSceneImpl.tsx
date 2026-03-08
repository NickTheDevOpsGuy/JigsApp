import { soundManager } from "@/audio/core/sounds";
import { getToleranceMultiplier } from "@/services/player/adaptiveDifficultyService";

import { PlayScreenLayout } from "@/screens/Play/components";
import { usePlayScreenPrimarySetup } from "@/screens/Play/core/scene/playScreenScenePrimarySetup";
import { usePlayScreenBehavior } from "@/screens/Play/core/scene/playScreenSceneBehavior";
import { usePlayScreenInteractions } from "@/screens/Play/core/scene/playScreenSceneInteractions";
import { usePlayScreenLayout } from "@/screens/Play/core/scene/playScreenSceneLayout";

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
