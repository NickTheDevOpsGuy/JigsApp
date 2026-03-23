# Task

Fix the Phuzzle UI issue without redesigning the screen.

## Goal

Make the current screen cleaner and more usable while preserving the existing flow and section order.

## Context

- This repo is mobile-first
- `AGENTS.md` is the source of behavioral rules
- Mobile layout is the source of truth
- Desktop is only an adaptation of mobile, not a redesign

## Constraints

- Do not redesign the screen
- Do not change section order unless explicitly required
- Do not introduce new navigation actions
- Do not reinterpret the screen as a desktop landing page
- Do not create a full-width layout for a mobile screen
- Do not shrink the UI into a tiny floating widget
- Keep one clear primary action
- Make bounded edits only

## Screen-specific rules

- Preserve the existing structure
- Improve spacing, hierarchy, and sizing only where needed
- Keep the primary CTA visually primary but not oversized
- Keep secondary actions clearly secondary
- If this is the replay screen:
  - use the top-right X as the dismiss action
  - do not add competing exit buttons
  - keep the replay stage and controls visually connected

## What to inspect first

- Outer wrapper and max-width behavior
- Centering logic
- Primary CTA sizing
- Section spacing
- Whether any container is causing tiny-widget or full-width behavior

## Deliverables

1. Brief diagnosis of the current issue
2. Exact files to edit
3. Minimal implementation plan
4. Code changes
5. Short summary of what changed and why

## Done when

- The screen still follows the existing flow
- The UI remains phone-sized and readable
- The layout is not full-width
- The layout is not a tiny centered widget
- No new navigation patterns were introduced
- Relevant lint/typecheck passes if applicable

## Validation

After making changes:

- run the relevant lint/typecheck for touched files
- confirm the layout still matches the existing screen structure
- confirm the fix is bounded and not a redesign
