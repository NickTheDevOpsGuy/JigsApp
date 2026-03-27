# Stats UI QA checklist

Manual pass for the Stats modal on mobile and desktop.

---

## Coverage

- Profile, Board (leaderboards), Badges
- Settings inside Profile
- Modal shell: header, tabs, empty states, scroll

---

## Devices / viewports

- iPhone SE or similar narrow phone
- iPhone 13/14/15 class
- Pixel-class Android
- iPad or small tablet (portrait)
- Desktop 520px–768px and full width

---

## Modal shell

- Opens centered on desktop; feels native on phone.
- Header compact; close button always visible.
- Long content scrolls inside the modal only.
- Reopen modal: scroll and layout reset.

---

## Tabs (Profile, Board, Badges)

- All three on one row at normal width.
- Narrow: tabs still readable and usable; no broken wrap.
- Active tab clearly indicated.
- Board progress pill stays with the tab.
- Switching tabs: no clipping or jumpy scroll.

---

## Profile

- Name, tier, streak, level read as one hero block.
- Stat tiles easy to scan.
- “See ranking” reads as secondary action.
- Finished puzzles grid: no big empty gap when partly filled.
- Daily Mastery bar and count aligned at all widths.

---

## Settings (inside Profile)

- Feels part of Profile, not a separate panel.
- Display name field matches UI density.
- Checkbox row tappable and aligned.
- Save reachable without excessive scroll on phone.

---

## Board / leaderboard

- Today / Week / All-time / Efficiency control fits at all widths.
- Sort control anchored to that row.
- Filters: collapsed shows a clear summary; expanded readable on narrow screens.
- All-time grid filter only for all-time.
- Empty states intentional, not placeholder.
- Current user highlighted in all modes.

---

## Badges

- Spacing consistent with Profile and Board.
- Progress count visible.
- Locked vs unlocked easy to tell apart.
- Long names/descriptions don’t break layout.

---

## Cross-state

Check: empty data, partly filled profile, full profile, long display name, large leaderboard list, locked-only badges, mixed badges, settings open while switching tabs.

---

## Input and a11y

- Mouse, touch, keyboard work for tabs, filters, sort, settings.
- Escape closes modal on desktop.
- Focus order sensible; focus visible on controls.
- Touch targets comfortable; text readable at increased OS text size.

---

## Before merge

```bash
npm run typecheck
npm run test
npm run build
```
