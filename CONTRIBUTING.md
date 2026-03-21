# Contributing to Phuzzle

Thanks for your interest in contributing. This doc covers how to get set up, run checks, and submit changes.

## Prerequisites

- Node.js (see [.nvmrc](.nvmrc) or `engines` in [package.json](package.json) if present)
- npm (or yarn/pnpm if the project supports it)

## Setup

```bash
git clone <repo-url>
cd phuzzle
npm install
```

Copy [.env.example](.env.example) to `.env` and fill in any required keys (e.g. Supabase, PostHog). See [doc/SUPABASE_SETUP.md](doc/SUPABASE_SETUP.md) for backend setup.

## Before committing / submitting a PR

Run these locally before you commit; CI will run them on the PR as well.

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `npm run lint`      | ESLint (TypeScript + jsx-a11y) |
| `npm run typecheck` | TypeScript (no emit)           |
| `npm run test`      | Unit tests (Vitest, 4 workers) |
| `npm run build`     | Production build               |

Optional:

- `npm run test:e2e` — Playwright E2E tests with 4 workers (run `npx playwright install` once; ensure port 5173 is free or app is not already running).
- `npm run format:check` — Prettier; use `npm run format` to fix.

Running the same commands before each commit helps catch issues early.

## Workflow

1. Open an issue or comment on an existing one so we can align on scope.
2. Create a branch from `main` (e.g. `feature/short-name` or `fix/short-name`).
3. Make your changes; keep commits focused and messages clear.
4. Run the pre-PR checks above and fix any failures.
5. Open a PR against `main` with a short description and, if relevant, a link to the issue.
6. Address review feedback; we’ll merge once everything looks good.

## Code and conventions

- **Lint**: ESLint is in [eslint.config.ts](eslint.config.ts). Fix auto-fixable issues with `npm run lint:fix`.
- **Style**: Prettier handles formatting; use the project’s config.
- **Types**: Prefer TypeScript types over `any`; the codebase is strict.
- **Storage**: Use `safeLocalStorage` from `@/utils/safeLocalStorage` instead of raw `localStorage` so private/incognito or full storage doesn’t break the app.
- **Console**: Use `console.warn` / `console.error` for diagnostics; avoid `console.log`/`console.debug` in production paths (or guard with `import.meta.env.DEV`).

## Docs and structure

- [README.md](README.md) — Overview, features, getting started, testing, PWA.
- [doc/](doc/) — CHANGES, LIGHTHOUSE, SUPABASE_SETUP, SHARING, STREAK-FREEZE, FUTURE, etc.
- [CONTRIBUTORS.md](CONTRIBUTORS.md) — List of contributors.

If you have questions, DM the maintainers or drop a note in the Discord (see README).

No gatekeeping. No ego. Just building something fun together.
