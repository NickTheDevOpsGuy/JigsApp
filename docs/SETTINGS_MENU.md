# Settings Menu

The Play screen menu is configured in
`src/app/screens/Play/components/headerMenu/`. The root menu is intentionally
small: Resume, New Puzzle, Settings, Leaderboard, and Help. Detailed controls
live under Settings so the in-game menu reads like a player menu rather than a
debug panel.

Some entries are shown only when their backing handler or capability exists.
Debug-only entries require `canShowDebug`; haptics require `canShowHaptics`;
daily visual modifiers require `onDailyPreferredModifierChange`.

## Settings Submenus

| Submenu         | Entries                                                                                                                                                          | Notes                                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Advanced        | Clear Cache, Performance Overlay, Reset Local Stats, Silhouette debug                                                                                            | Cache and stats actions are shown when handlers are provided. Performance and silhouette controls are debug-only.                                                            |
| Appearance      | Color blind friendly, Immersive Mode, Preview, Show minimap                                                                                                      | Color blind friendly changes progress/done/success states to blue. Minimap appears when minimap state is available.                                                          |
| Assistance      | Alignment Grid, Cluster Outlines, Edge Highlight                                                                                                                 | Visual aids for solving. Grouped under Gameplay. Cluster Outlines is shown when its handler is provided.                                                                     |
| Audio           | Background Music, Haptics, Sound Effects                                                                                                                         | Haptics is shown only on supported devices/capabilities.                                                                                                                     |
| Gameplay        | Parent submenu for Assistance, Modes, Move behavior, Piece Shape, Snapping, and Controls                                                                         | Gameplay groups solving behavior and viewport controls.                                                                                                                      |
| Effects         | Fog, Night, None, Sepia                                                                                                                                          | Daily preferred visual modifier. Grouped under Appearance. These apply when daily modifier support is wired.                                                                 |
| Manual Controls | Reset View, Zoom In, Zoom Out                                                                                                                                    | Manual board viewport controls. Grouped under Gameplay.                                                                                                                      |
| Modes           | Adaptive Personality, Auto-align on snap, Deliberate Detach, Drift Mode, Dynamic Difficulty, Mystery Mode, Precision Mode, Relaxed Mode, Show Timer, Zen Ambient | Grouped under Gameplay. Most are toggles. Deliberate Detach, Drift Mode, and Relaxed Mode are shown only when their handlers are provided.                                   |
| Move behavior   | Undo & Redo, Undo, Redo                                                                                                                                          | Grouped under Gameplay. Undo & Redo enables or disables move history controls. Undo/Redo are disabled when history is unavailable or the feature is off.                     |
| Piece Shape     | Classic, Hard, Irregular                                                                                                                                         | Grouped under Gameplay. Radio-style choices. Applies to the next puzzle.                                                                                                     |
| Snapping        | Magnetic Snap, Progressive Reveal, Snap Glow, Unlock Pieces                                                                                                      | Grouped under Gameplay. Snap Glow shows target highlights, "Fits here" / "Almost" labels, and non-color icons while dragging. Unlock Pieces is the inverse of piece locking. |

## Root Actions

| Root action | Notes                                                           |
| ----------- | --------------------------------------------------------------- |
| Resume      | Closes the menu and returns focus to the hamburger button.      |
| New Puzzle  | Opens the existing new-puzzle flow.                             |
| Settings    | Opens Gameplay, Appearance, Audio, and Advanced groups.         |
| Leaderboard | Navigates to `/stats`.                                          |
| Help        | Opens How to Play, Keyboard & Controls, and contribution links. |

## Menu Layout And Accessibility

- Menu panels are portaled and clamped to the viewport.
- Small screens and short viewports use a constrained bottom sheet instead of
  cascading hover flyouts.
- Menu rows are at least 44px tall.
- `Escape` backs out of the active panel or closes the menu.
- Closing the menu returns focus to the menu button.
- Icon-only controls still need visible labels or `aria-label`; `title` text is
  helpful rollover text, not the only accessible name.

## Hidden Or Conditional Items

| Entry               | Status                                                      |
| ------------------- | ----------------------------------------------------------- |
| Ghost Hint          | Present in config but hidden.                               |
| Ghost When Idle     | Present in config but hidden.                               |
| Clear Cache         | Conditional on `onClearCache`.                              |
| Reset Local Stats   | Conditional on `onResetStats`.                              |
| Background Music    | Conditional on `onToggleMusic`.                             |
| Haptics             | Conditional on `canShowHaptics`.                            |
| Performance Overlay | Conditional on `canShowDebug`.                              |
| Silhouette debug    | Conditional on `canShowDebug` and `onToggleShowSilhouette`. |
| Daily Effects       | Conditional on `onDailyPreferredModifierChange`.            |

## Source Map

| File                             | Responsibility                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| `headerMenuConfig.tsx`           | Builds all menu items.                                                                     |
| `headerMenuConstants.ts`         | Root labels, submenu labels, parent submenu map, descriptions, and Settings grouping.      |
| `headerMenuItemsDisplay.ts`      | Appearance, Effects, Assistance, Piece Shape, and some Snapping entries.                   |
| `headerMenuItemsNavModes.ts`     | Navigate, Move, Manual Controls, and the Modes composition.                                |
| `headerMenuItemsNavModesData.ts` | Modes and snap-related toggles.                                                            |
| `headerMenuItemsRest.ts`         | Audio, Advanced, Leaderboard, Share, Help, and Get Involved entries.                       |
| `HeaderMenuCore.tsx`             | Renders root actions, submenu lists, nested submenu panels, focus return, and item states. |

When adding, hiding, or renaming a menu setting, update the config file and this
document in the same change.
