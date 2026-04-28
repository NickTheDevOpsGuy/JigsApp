# Settings Menu

The Play screen menu is configured in
`src/app/screens/Play/components/headerMenu/`. The menu has four root tabs:
About, Leaderboard, Play, and Settings. Settings submenus are sorted
alphabetically by their visible labels.

Some entries are shown only when their backing handler or capability exists.
Debug-only entries require `canShowDebug`; haptics require `canShowHaptics`;
daily visual modifiers require `onDailyPreferredModifierChange`.

## Settings Submenus

| Submenu | Entries | Notes |
| --- | --- | --- |
| Advanced | Clear Cache, Performance Overlay, Reset Local Stats, Silhouette debug | Cache and stats actions are shown when handlers are provided. Performance and silhouette controls are debug-only. |
| Appearance | Color blind friendly, Immersive Mode, Preview, Show minimap | Color blind friendly changes progress/done/success states to blue. Minimap appears when minimap state is available. |
| Assistance | Alignment Grid, Cluster Outlines, Edge Highlight | Visual aids for solving. Cluster Outlines is shown when its handler is provided. |
| Audio | Background Music, Haptics, Sound Effects | Haptics is shown only on supported devices/capabilities. |
| Controls | Parent submenu for Manual Controls, Modes, Move, and Piece Shape | Controls groups gameplay-control submenus rather than direct controls. |
| Effects | Fog, Night, None, Sepia | Daily preferred visual modifier. These apply when daily modifier support is wired. |
| Leaderboard | Leaderboard | Navigates to `/stats`. |
| Manual Controls | Reset View, Zoom In, Zoom Out | Manual board viewport controls. This submenu is grouped under Controls. |
| Modes | Adaptive Personality, Auto-align on snap, Deliberate Detach, Drift Mode, Dynamic Difficulty, Mystery Mode, Precision Mode, Relaxed Mode, Show Timer, Zen Ambient | Most are toggles. Deliberate Detach, Drift Mode, and Relaxed Mode are shown only when their handlers are provided. |
| Move | Undo & Redo, Undo, Redo | Undo & Redo enables or disables move history controls. Undo/Redo are disabled when history is unavailable or the feature is off. |
| Piece Shape | Classic, Hard, Irregular | Radio-style choices. Applies to the next puzzle. |
| Snapping | Magnetic Snap, Progressive Reveal, Snap Glow, Unlock Pieces | Snap Glow shows clear fit, near-fit, and rotate cues while dragging. Unlock Pieces is the inverse of piece locking. |

## Play Tab Items

These are configured as settings items but are shown under Play instead of the
Settings submenu list:

| Submenu | Entries | Notes |
| --- | --- | --- |
| Navigate | Home, Restart puzzle | Home returns to `/`. Restart puzzle is shown when the current puzzle can be restarted. |
| Share | Co-op | Starts a co-op session when sharing is available. Shows a disabled loading state while a session is being created. |

## About Tab Items

The About tab includes the help and contribution entries from the same menu
configuration:

| Submenu | Entries | Notes |
| --- | --- | --- |
| Help | How to Play, Keyboard & Controls | Opens the tutorial or shortcuts modal. |
| Get Involved | Get Involved, Meet the Team | Opens the GitHub repository or contributors list. |

## Hidden Or Conditional Items

| Entry | Status |
| --- | --- |
| Ghost Hint | Present in config but hidden. |
| Ghost When Idle | Present in config but hidden. |
| Clear Cache | Conditional on `onClearCache`. |
| Reset Local Stats | Conditional on `onResetStats`. |
| Background Music | Conditional on `onToggleMusic`. |
| Haptics | Conditional on `canShowHaptics`. |
| Performance Overlay | Conditional on `canShowDebug`. |
| Silhouette debug | Conditional on `canShowDebug` and `onToggleShowSilhouette`. |
| Daily Effects | Conditional on `onDailyPreferredModifierChange`. |

## Source Map

| File | Responsibility |
| --- | --- |
| `headerMenuConfig.tsx` | Builds all menu items. |
| `headerMenuConstants.ts` | Root labels, submenu labels, parent submenu map, descriptions, and Settings submenu sorting. |
| `headerMenuItemsDisplay.ts` | Appearance, Effects, Assistance, Piece Shape, and some Snapping entries. |
| `headerMenuItemsNavModes.ts` | Navigate, Move, Manual Controls, and the Modes composition. |
| `headerMenuItemsNavModesData.ts` | Modes and snap-related toggles. |
| `headerMenuItemsRest.ts` | Audio, Advanced, Leaderboard, Share, Help, and Get Involved entries. |
| `HeaderMenuCore.tsx` | Renders root tabs, submenu lists, nested submenu panels, and item states. |

When adding, hiding, or renaming a menu setting, update the config file and this
document in the same change.
