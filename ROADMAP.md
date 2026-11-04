# ROADMAP.md — J vagy LY?

**Written 2026-11-04** after a full-repo review (`docs/review-2026-11-04.md`). The earlier planning documents are preserved verbatim in `docs/` (`docs/REQUIREMENTS.md`, `docs/HUNGARIAN_J_LY_APP_PLAN.md`); where they disagree with this file, this file wins. This file is only the plan: status, what is next, what must be decided, and what "done" means per phase. The record of what shipped lives in `docs/delivery-log.md`.

Companions: `CLAUDE.md` (rules and conventions — read first), `docs/review-2026-11-04.md` (the reasoning), `docs/delivery-log.md` (history), `IDEAS.md` (backlog).

## How to work this file

- A phase is **Delivered** when its code is merged and CI-green, and **Accepted** when its bold **Accept:** line has actually been observed (on production, not just locally). Accept lines that need a real phone are batched into an owner device session.
- Each deliverable lands as one PR with `npm run verify` green locally and CI green on GitHub.
- When a batch makes a decision, record it in two places: a one-line entry under the phase here, and a comment at the site of the decision.

## Status at a glance (2026-11-04)

| Phase | Name | Code | Accept line | Gap to Accept |
| --- | --- | --- | --- | --- |
| 0 | MVP game on Vercel | delivered | ✅ met | live at `j-or-ly.vercel.app` since 2026-05 |
| 1 | Hardening | not started | — | everything |
| 2 | PWA-ready | not started | — | everything, plus a phone install check |
| 3 | Design pass | not started | — | brief to be written in Phase 2 (`docs/design/BRIEF.md`) |

## Decisions — decided 2026-11-04 (owner, upfront for the hardening batch)

- **D1 — licence: MIT.** Replace the GPL-3.0 `LICENSE` with MIT text, matching `package.json` and what the README always claimed.
- **D2 — push autonomy for the hardening/PWA batch: push, verify on the Vercel preview, merge, re-verify production.**
- **D3 — legacy cleanup: delete** the Streamlit/Dash-era files and the two fully merged remote branches (`codex/hungarian-word-practice`, `vercel/react-server-components-cve-vu-hlh31x`).
- **D4 — naming: `j-vagy-ly` everywhere in the repo.** The Vercel project/domain rename is an owner dashboard step (see "Owner steps"). Until then the live URL stays `j-or-ly.vercel.app`.

## Phase 0 — MVP game on Vercel (delivered)

Single-page game: two buttons, immediate feedback, score, keyboard shortcuts, failed-word backlog with mastery and confetti, top-3 high scores, new-game confirmation, configurable auto-advance. See `docs/delivery-log.md`.

## Phase 1 — Hardening

Work list = review §5. Done means:

1. **Dependencies.** `next`/`react`/`react-dom`/`eslint-config-next` on the current patch releases. `npm audit --omit=dev` shows **no high or critical**. `next-transpile-modules` removed, `@types/*` in devDependencies.
2. **Build config.** No `ignoreBuildErrors`, no `output: 'standalone'`. `turbopack.root` pinned. `tsconfig.tsbuildinfo` gitignored. `npm run build` typechecks and passes.
3. **Security headers.** CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`/`frame-ancestors` served on production. No CSP violations in the console during a round, including the confetti on mastery.
4. **Quality gates.** `npm run lint` (ESLint flat config) clean. Jest tests cover the game logic (answer/next/backlog/mastery/immutability), high-score folding and storage validation/migration. pytest covers the real generator. `npm run verify` runs them all. A GitHub Actions workflow runs `verify` on PRs and `main`.
5. **Logic fixes.** Review L1–L11, S5, S6: per-session high scores, immutable state updates, failed words keyed by pair with a v1→v2 storage migration, a load-failure error state, forced light theme, keyboard handling that leaves focused controls alone, Escape-closable accessible dialogs, encoded links, corrected tip and shortcut copy, a single viewport meta tag, no dead code.
6. **Generator.** Readable swap rules, the 15-character limit applied to both words, minified JSON. **The set of pairs is unchanged** (asserted in the PR).
7. **Repo hygiene.** MIT `LICENSE` (D1), `j-vagy-ly` naming (D4), legacy files and branches gone (D3).

**Accept:** on production, `curl -I` shows the security headers. A full round (answer right, answer wrong, next, new game) runs with no console errors. The top-3 list shows one entry per finished session. CI is green on `main`.

## Phase 2 — PWA-ready

Approach: Next's built-in `app/manifest.ts`, plus a **hand-written service worker** (`public/sw.js`). Readable, no plugin. The Serwist/next-pwa plugins are webpack-oriented, and this repo builds with Turbopack.

1. **Manifest and icons.** `app/manifest.ts` (name, short name, Hungarian `lang`, `display: standalone`, theme/background colours, 192/512 and maskable icons). An apple-touch-icon and favicon. `viewport.themeColor`. The icons are **generated placeholders** (`scripts/generate-icons.mjs`) until the design pass.
2. **Service worker.** Versioned caches. Navigations are network-first with a cache fallback (so a deploy never pins users to deleted chunk hashes), `/_next/static/*` is cache-first (content-hashed, immutable), and `jly-pairs.json` is stale-while-revalidate. Old caches are removed on `activate`. Registration happens in production builds only. `sw.js` itself is served `no-cache`.
3. **Offline behaviour.** After one online visit, a reload with the network off still shows the game and a round is playable. Without a cached copy, the load-failure state shows a Hungarian message instead of crashing.
4. **Design handover.** `docs/design/BRIEF.md` for Phase 3.

**Accept:** (a) on the production URL, a headless Chromium check finds the manifest valid, the SW active, and an offline reload playable. (b) **Owner device check:** install to the home screen on a real phone, open it in aeroplane mode, and play a round.

## Phase 3 — Design pass (owner-driven, Claude Design)

Input: `docs/design/BRIEF.md` (written in Phase 2). Expected outputs: an app icon set (incl. maskable), a real dark theme, and a visual polish of the game card, feedback and side panels. Then an implementation batch.

**Accept:** the placeholder icons have been replaced, dark mode is re-enabled and legible, and the owner signs off on the look on a phone.

## Owner steps (no code)

- Rename the Vercel project and/or add a `j-vagy-ly` domain (D4), then update the live URL in `README.md`.
- The Phase 2 device check.
