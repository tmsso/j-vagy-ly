# CLAUDE.md — J vagy LY?

Project brief for Claude Code. Read this fully before writing code. `ROADMAP.md` is the plan (status table, decisions, per-phase done criteria — plan only, keep it short). `docs/delivery-log.md` is the record of what shipped when (append dated entries there). `IDEAS.md` holds loose future ideas. `docs/review-2026-11-04.md` is a point-in-time review with the reasoning behind the current plan. `docs/REQUIREMENTS.md` and `docs/HUNGARIAN_J_LY_APP_PLAN.md` are the original plans, kept verbatim for the record. Do not edit them.

## Communicating with the project owner

The owner is a non-developer tech lead: comfortable with technical jargon and reasoning, not with the specifics of modern web/JS tooling. On first use of a new technology, library or tool, give a one-line explanation of what it is and why it is used here. When code does something non-obvious, explain the *why* briefly in a comment.

This repo is **public**. Commits, docs, comments and fixtures refer to the owner as "the project owner", never by name.

## 1. What this is

A Hungarian spelling-practice game. Each round shows two spellings of a word that differ only in `j` vs `ly` (`folyó` / `fojó`), and the player picks the correct one. Missed words come back more often until mastered. The UI is entirely in Hungarian. No accounts and no backend: progress lives in the player's own `localStorage`.

## 2. Constraints that drive decisions

1. **Static site.** The page prerenders to static HTML, and all game logic runs in the browser. Do not add server code (API routes, Server Actions, middleware) without a roadmap decision.
2. **Free hobby hosting on Vercel.** `main` auto-deploys to production; branches get preview deployments.
3. **Offline-capable (PWA, Phase 2).** Everything the game needs (page, JS, `jly-pairs.json`) must be cacheable by the service worker.
4. **Hungarian first.** All UI copy is Hungarian. Grammar or spelling *content* (tips, explanations) must be factually right. This is a spelling app.

## 3. Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind CSS 3 · `canvas-confetti` · Jest · ESLint (flat config) · Python 3 for data generation · Vercel.

- **The word pairs are generated and committed.** `scripts/generate-pairs.py` turns `data/magyar-szavak.txt` into `public/jly-pairs.json`. It also runs as `prebuild`. It is deterministic: the same input gives a byte-identical output, and CI checks that the committed file is current. Never hand-edit the JSON.
- **PWA:** `app/manifest.ts` (manifest) and `public/sw.js` (hand-written service worker; its header comment explains the caching strategy). Registration is production-only (`app/components/ServiceWorkerRegister.tsx`). Icons are generated from `design/icon.svg` (and `design/favicon.svg` for 32 px) by `node scripts/generate-icons.mjs` and committed.
- **Design tokens:** colours are CSS variables in `app/globals.css` (light values, then dark values under `prefers-color-scheme: dark`), exposed to Tailwind under semantic names in `tailwind.config.ts`. Use those classes (`bg-card`, `text-ink-muted`, `border-success-600`, …), never raw hex or Tailwind palette colours, so dark mode keeps working without `dark:` variants. Fonts come only through `next/font` (Inter for UI, Literata for words). The design record is `docs/design/handoff-01/`.
- `app/constants.ts` holds the tunable game constants (`AUTO_ADVANCE_DELAY_SECONDS`).
- Game rules live in `app/utils/gameLogic.ts` and must stay **pure** (no `window`, no storage, no React), so they can be unit-tested. Storage reading, validation and migration sit in their own module.

## 4. Working rules

- `npm run verify` before every push. It runs lint, typecheck, Jest, the Python unittest suite and the build. CI runs the same.
- `localStorage` contents are untrusted input: validate field by field, drop what doesn't fit, and never let bad storage crash the game. Storage keys are versioned. A schema change needs a migration and a test.
- Pushing to `main` deploys production. Code changes go through a PR. A pure docs sync may go straight to `main`.
- Before committing, grep the diff for local absolute paths, secrets and the owner's name.
- Keep dependencies on maintained releases. Majors (Tailwind 4, TypeScript 7, Jest 30) are deliberate roadmap items, not drive-by bumps.
