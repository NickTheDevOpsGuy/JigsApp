# Bug report flow

How users report bugs in Phuzzle and where it’s implemented.

---

## Where users find it

- **Home screen:** Feedback text action, or Help (?) -> Feedback -> **Report a bug** / **Suggest a feature**.
- **Play screen:** Help/About surfaces can open the same Feedback choice modal when an `onOpenFeedback` handler is provided.

A modal opens. Closing it returns to the previous screen.

---

## What it does

- **Form choice:** **Report a bug** or **Suggest a feature**.
- **Submit behavior:** Creates a temporary POST form for the configured Formspree target and submits it in a new tab/window.
- **Environment:** Callers can include an optional environment snippet, such as user agent, viewport, puzzle context, grid size, or route.

The default targets live in `src/app/components/FeedbackChoiceModal/feedbackLinks.ts`.
They can be overridden with `VITE_FORMSPREE_BUG_FORM_ID` and
`VITE_FORMSPREE_FEATURE_FORM_ID`.

---

## Main files

| Path                                                          | Purpose                                            |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `src/app/components/FeedbackChoiceModal/`                     | Current Report a bug / Suggest a feature choice    |
| `src/app/components/FeedbackChoiceModal/feedbackLinks.ts`     | Default and env-configured feedback form targets   |
| `src/app/components/HelpChoiceModal/HelpChoiceModal.tsx`      | Help menu: report / suggest when handlers provided |

Callers can pass an optional `environmentSnippet`, such as puzzle type or grid
size, to include context in the form submission.
