# Stats UI QA Checklist

Manual parity pass for the Phuzzle stats modal on mobile and desktop.

## Coverage

- Profile
- Board / leaderboards
- Badges
- Settings inside Profile
- Shared modal shell, header, tabs, empty states, and scroll behavior

## Devices and viewports

- iPhone SE or equivalent narrow phone
- iPhone 13/14/15 class phone
- Pixel-class Android phone
- iPad or small tablet portrait
- Narrow desktop window around 520px to 768px
- Standard desktop width

## Modal shell

- Modal opens centered on desktop and feels screen-native on phone.
- Header does not waste vertical space.
- Close button stays visible at all supported sizes.
- Long content scrolls inside the modal body, not the page behind it.
- Reopen the modal after closing; scroll position and layout reset correctly.

## Top tabs

- `Profile`, `Board`, and `Badges` remain on one row at normal widths.
- On narrow widths, tabs remain readable and horizontally usable without broken wrapping.
- Active tab state is obvious on both desktop and mobile.
- Board progress pill remains visually attached to the tab.
- Switching tabs preserves expected state without clipping or jumpy scroll.

## Profile

- Name, tier, streak, and level read as one clear hero group.
- Stats tiles are easy to scan on phone and desktop.
- `See ranking` reads like a secondary action tied to the 4x4 stat.
- Finished puzzles grid does not create large dead space when partially filled.
- Daily Mastery bar and count stay aligned at all widths.

## Settings

- Settings expansion feels attached to Profile, not like a separate panel.
- Display name field matches surrounding UI density and spacing.
- Checkbox row remains tappable and aligned.
- Save action is reachable without awkward extra scroll on phones.
- Expanded and collapsed states both look intentional.

## Board / leaderboard

- `Today / Week / All-time / Efficiency` segmented control fits cleanly at all widths.
- Sort control stays visually anchored to the segmented row.
- Filters collapsed state shows a concise summary, not a vague placeholder.
- Expanded filters remain readable on narrow screens and do not overlap.
- All-time grid filter appears only for all-time.
- Empty states feel polished and intentional, not placeholder text.
- Current-user highlighting remains visible in all leaderboard modes.

## Badges

- Badge list spacing matches Profile and Board.
- Progress count is visible immediately.
- Locked and unlocked states are easy to scan.
- Long badge names and descriptions do not break alignment.

## Cross-state parity

- Empty data
- Partially filled profile
- Fully populated profile
- Long display name
- Large leaderboard list
- Locked-only badges
- Mixed locked and unlocked badges
- Settings open while switching tabs and returning

## Input and accessibility smoke

- Mouse, touch, and keyboard all work for tabs, filters, sort, and settings.
- `Escape` closes the modal on desktop.
- Focus order is sane when tabbing.
- Focus indicators remain visible on interactive controls.
- Touch targets remain comfortable on phones.
- Text remains readable at increased OS text size.

## Regression gate

Run before merge:

```bash
npm run typecheck
npm run test
npm run build
```
