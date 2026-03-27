# Bug report flow

How users report bugs in Phuzzle and where it’s implemented.

---

## Where users find it

- **Play screen:** Settings (☰) → About → Feedback → **Report a bug** or **Suggest a feature**.
- **Home screen:** Megaphone icon, or Help (?) → **Report a bug** / **Suggest a feature**.

A modal opens. Closing it returns to the previous screen.

---

## What it does

- **Form:** Optional email, required “What went wrong?” description, optional screenshots (file input / drag-and-drop, multiple files).
- **Submit:** Builds a `mailto:anickclark@gmail.com` with subject “Phuzzle Bug Report” and a body that includes the description, screenshot names, optional reply-to, and an optional **Environment** block (User-Agent, viewport, puzzle context if the app provides it).
- The user’s email app opens; they attach screenshots there and send. The modal thanks them and closes.

No server is used; reporting is client-side only via `mailto`.

---

## Main files

| Path                                                          | Purpose                                            |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `src/app/components/BugReportModal/BugReportModal.tsx`        | Modal UI, form state, file input, mailto build     |
| `src/app/components/BugReportModal/BugReportModal.module.css` | Styles                                             |
| `src/app/components/FeedbackChoiceModal/`                     | Home: “Report a bug” / “Suggest a feature” choice  |
| `src/app/components/HelpChoiceModal/HelpChoiceModal.tsx`      | Help menu: report / suggest when handlers provided |
| `src/app/screens/Play/components/headerMenuItemsRest.ts`      | “Report a bug” under Feedback in Settings          |

Callers can pass an optional `environmentSnippet` (e.g. puzzle type, grid size) to add to the email body.
