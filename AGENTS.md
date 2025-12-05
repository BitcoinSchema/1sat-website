# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` is the App Router surface (routes like `market/`, `listings/`, `wallet/`, shared `layout.tsx`, `globals.css`); middleware and API handlers sit in `middleware.ts` and `src/app/api/`.
- UI primitives live in `src/components/`; shared logic in `src/hooks/`, `src/utils/`, and `src/lib/`; contexts/providers in `src/providers/`; reactive state in `src/signals/`; typed shapes in `src/types/`; reusable assets in `src/assets/` and static files in `public/`.
- Tests live in `tests/` (Playwright specs) and ad-hoc smoke scripts in `test-*.mjs`; artifacts can be dropped in `test-results/`.
- API defaults are centralized in `constants.ts` with environment overrides noted in `VERCEL_ENV_SETUP.md`.

## Build, Test, and Development Commands
- `bun install` (preferred) or `npm install` to sync dependencies.
- `bun run dev` starts the app at http://localhost:3000; adjust ports in the smoke scripts if you change it.
- `bun run build` for production bundles; `bun run start` serves the built output.
- `bun run lint` runs Next/ESLint checks.
- `bunx playwright test tests/page-transitions.spec.ts` exercises market tab transitions; ensure the app is running on 3000 first.
- `bun test-homepage.mjs`, `bun test-all-pages.mjs`, etc. are quick console-only sanity checks (default target http://localhost:3001).

## Coding Style & Naming Conventions
- TypeScript + ESM modules; 2-space indents, semicolons, and trailing commas where lint allows. Keep JSX lean and prefer functional components.
- Components: PascalCase files in `src/components/`; hooks: `useX` in `src/hooks/`; utilities/helpers in `src/utils/` as camelCase exports; constants uppercase in `constants.ts`.
- Styling favors Tailwind/DaisyUI classes; compose classes with `clsx`/`tailwind-merge` instead of inline conditionals.

## Testing Guidelines
- Use Playwright for user flows; colocate new specs in `tests/` as `*.spec.ts`. Keep tests idempotent and target stable selectors (data attributes where possible).
- Run `bun run dev` (or a built server) before Playwright. Smoke scripts can reveal console errors quickly; capture output in `test-results/` when sharing findings.
- Aim to cover new routes and critical market interactions; no formal coverage target yet, but avoid regressing tab transitions, listings, and wallet flows.

## Commit & Pull Request Guidelines
- Follow the existing history: short, imperative subjects with optional dash detail (e.g., `Fix feed API endpoint - use upstream ordinals API`). Keep scope focused and avoid bundling unrelated fixes.
- PRs should explain what changed, why, and how to validate (commands run, screenshots for UI shifts, and any perf metrics). Link issues or tickets when available and call out env toggles or migrations.
- Note any API host changes; coordinate env updates per `VERCEL_ENV_SETUP.md` and avoid committing secrets or tokens.
