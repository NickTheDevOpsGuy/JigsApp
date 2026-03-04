# Bug report in Phuzzle

This doc describes the in-app **bug report** flow: where it lives, what it does, and which files implement it.

## Where to find it

- **Play screen** — **Settings** (hamburger) → **About** → **Feedback** → **Report a bug** or **Suggest a feature**.
- **Home screen** — **Megaphone** (next to the ? button) opens a **Feedback** choice: **Report a bug** or **Suggest a feature**. Or **Help** (?) → **Report a bug** / **Suggest a feature**.
- The bug report opens as a modal. Closing it returns to the previous screen (settings menu or home).

## What it does

- **Form fields**
  - Optional **email** (for reply-to).
  - Required **What went wrong?** (description).
  - Optional **screenshots** via file input with drag-and-drop; multiple files supported.
- **Submit** builds a `mailto:anickclark@gmail.com` link with:
  - Subject: `Phuzzle Bug Report`
  - Body: description, optional screenshot file names, optional reply-to, and optional **Environment** section (User-Agent, viewport, screen; plus optional `environmentSnippet` from the app for puzzle context).
- The user’s email app opens; they attach screenshots there and send. The modal shows a short “Thanks for helping improve Phuzzle!” then closes.

**UX (redesign)**  
Order: What went wrong? → Add screenshot (optional, large drop zone + thumbnails with remove) → Email (optional) → Cancel / Send Bug Report → reassurance line “Your email app will open with the report.” Primary button label: “Send Bug Report”. Optional bug icon wiggle on open; compact layout to reduce scrolling.

## Key files

| Path                                                          | Purpose                                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/app/components/BugReportModal/BugReportModal.tsx`        | Modal UI, form state, file input/drag-drop, mailto build and open                                |
| `src/app/components/BugReportModal/BugReportModal.module.css` | Styles (gradient accent, layout); uses project CSS variables                                     |
| `src/app/components/BugReportModal/index.ts`                  | Component export                                                                                 |
| `src/app/screens/Play/PlayScreen.tsx`                         | `showBugReport` state, renders `<BugReportModal />`; passes `onShowBugReport` to header menu     |
| `src/app/screens/Menu/MenuScreen.tsx`                         | `showBugReport` state, renders `<BugReportModal />`; passes `onShowBugReport` to HelpChoiceModal |
| `src/app/screens/Play/components/headerMenuItemsRest.ts`      | "Report a bug" item under Feedback submenu (`subMenu: "feedback"`)                               |
| `src/app/screens/Play/components/HeaderMenuSubmenuPanel.tsx`  | Feedback trigger under About (Settings → About → Feedback)                                       |
| `src/app/components/HelpChoiceModal/HelpChoiceModal.tsx`      | "Report a bug" and "Suggest a feature" when handlers provided                                    |
| `src/app/components/FeedbackChoiceModal/`                     | Choice modal (Report a bug / Suggest a feature) used by home megaphone                           |
| `src/app/components/FeatureReportModal/`                      | Suggest a feature form; mailto "Phuzzle Feature Request"                                         |

The bug report reuses the shared **Modal** and **Button** components.

## Behaviour notes

- Screenshots are only listed in the mailto body; the user must attach them in their email client.
- No server or backend is involved; reporting is client-side only via `mailto`.
- **Optional `environmentSnippet` prop**: Callers (e.g. PlayScreen) can pass a string (e.g. puzzle type, grid size, session id) to be appended under “--- Environment ---” in the email body for more actionable reports.
