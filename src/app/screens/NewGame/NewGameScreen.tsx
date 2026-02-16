/**
 * NewGameScreen – route wrapper for /new; delegates to SetupScreen.
 */
import SetupScreen from "@/screens/Setup/SetupScreen";

/**
 * NewGameScreen
 *
 * Route wrapper for /new
 */
export function NewGameScreen() {
  return <SetupScreen />;
}
