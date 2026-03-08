import { createPlayScreenLayoutProps } from "@/screens/Play/core/utils/playScreenLayoutPropsBuilder";
import { usePlayScreenLayoutInputs } from "./playScreenSceneLayoutInputs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ctx shape is large and shared across layout/behavior/interactions
export function usePlayScreenLayout(ctx: any) {
  const inputs = usePlayScreenLayoutInputs(ctx);
  return createPlayScreenLayoutProps(inputs);
}
