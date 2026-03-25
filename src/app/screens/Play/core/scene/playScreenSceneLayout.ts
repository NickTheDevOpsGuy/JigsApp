import type { NavigateFunction, NavigateOptions, To } from "react-router-dom";

import { createPlayScreenLayoutProps } from "@/screens/Play/core/utils/playScreenLayoutPropsBuilder";
import { usePlayScreenLayoutInputs } from "./playScreenSceneLayoutInputs";

import type { PlayScreenSceneLayoutContext } from "./playScreenSceneLayoutContext.types";
import type { ResumeChoice } from "@/screens/Play/hooks/manager/playScreenManagerTypes";

/**
 * Bridges loosely typed layout inputs to `PlayScreenLayoutArgs` without widening
 * the whole builder yet. TODO: tighten `PlayScreenLayoutArgs` and delete this shim.
 */
export function usePlayScreenLayout(ctx: PlayScreenSceneLayoutContext) {
  const inputs = usePlayScreenLayoutInputs(ctx);

  const navigate = ((to: To | number, options?: NavigateOptions) => {
    void inputs.navigate(to as never, options as never);
  }) as NavigateFunction;

  const setResumeChoice = (choice: unknown): void => {
    inputs.setResumeChoice(choice as ResumeChoice);
  };

  return createPlayScreenLayoutProps({
    ...inputs,
    navigate,
    setResumeChoice,
  });
}
