import { SetupScreen } from "@/screens/Setup/SetupScreen";

/**
 * NewGameScreen
 *
 * This screen exists to represent the `/new` route.
 * It delegates all setup logic (image upload, preview, validation)
 * to SetupScreen so the flow stays clean and testable.
 */
export function NewGameScreen() {
  return <SetupScreen />;
}
