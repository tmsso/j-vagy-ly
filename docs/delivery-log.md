# Delivery log — J vagy LY?

Record of what shipped, when, and why. Append dated entries at the bottom; `ROADMAP.md` stays the plan. Entries before 2026-11-04 were reconstructed from git history.

## 2026-05-19 — Origins and the Next.js rewrite

- Started as a Python playground: a word-guessing toy (`main.py`, Streamlit and Dash variants) plus a Streamlit j/ly plan (`docs/HUNGARIAN_J_LY_APP_PLAN.md`). The word list `data/magyar-szavak.txt` came via the sibling Betűvető project.
- `docs/REQUIREMENTS.md` re-planned it as a static Next.js app on Vercel, and the app was implemented the same day (`93e5bac`).
- PR #1 (Vercel bot): React Server Components CVE patch.
- Same-day iteration on the learning loop: a failed-word backlog every 4th question, green after 2 correct in a row, mastered (removed, with confetti) after 4, manual removal, `bothCorrect` pairs ("Mindkettő helyes!"), alpha filtering of the corpus, top-3 high scores, and new-game confirmation.

## 2026-05-25 — Generator refactor and build fixes

- `scripts/generate-pairs.py` refactored (`jj↔lly`, `ly↔j`, `j↔ly` swaps; 15-character limit; `bothCorrect` flag). `public/jly-pairs.json` regenerated: 16,682 pairs.
- A run of fixes for `localStorage` access during the static build and duplicate-page warnings. ESLint/Next config bumps. `next-transpile-modules` added (it was never used).
- Placeholder Jest tests added (`tests/app.test.js`).

## 2026-08-02 — Auto-advance

- `92ca852`: after a correct answer, the next word appears after `AUTO_ADVANCE_DELAY_SECONDS` (default 5). A progress bar sits on the Next button, any pointer or key input cancels the countdown, there is an opt-out checkbox, and `0` disables the feature.

## 2026-11-04 — Review and docs release

- The repo had been renamed on GitHub to `tmsso/j-vagy-ly` in the meantime.
- Full status, security and logic review: `docs/review-2026-11-04.md`.
- New doc structure: `CLAUDE.md`, `ROADMAP.md` (Phases 1–3 with Accept lines, decisions D1–D4), `IDEAS.md`, this log, and a refreshed `README.md`. The old plan documents moved verbatim into `docs/`.

## 2026-11-04 — Phase 1 hardening

- Dependencies: Next 16.4.5, React 19.3.1. `npm audit --omit=dev` is clean. `next-transpile-modules` removed.
- Build: typechecks again (no `ignoreBuildErrors`), no `standalone` output, `turbopack.root` pinned.
- Security headers (CSP, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy) via `next.config.ts`, verified in headless Chromium, including the mastery confetti (which needs `worker-src blob:`).
- Logic: per-session high scores, immutable state updates, failed words keyed by pair with a v1→v2 storage migration, validated storage, a load-error message, forced light theme, keyboard handling that leaves focused controls alone, native `<dialog>` confirmations, encoded links, and a visible "Új játék" button.
- Content: replaced the false "magas/mély hangrend" tip with accurate guidance, and fixed the shortcut list.
- Generator rewritten readably and minified. Played pair set unchanged.
- Quality gates: ESLint flat config, 26 Jest tests, 7 unittest tests, `npm run verify`, GitHub Actions CI.
- Repo: MIT licence (D1), renamed to `j-vagy-ly` (D4), and the Streamlit/Dash leftovers deleted (D3).
- Merged as #2 (`1a42cd2`). Accepted on production the same day: headers served, smoke run and mastery confetti with no console errors. Stale remote branches deleted (D3).

## 2026-11-04 — Phase 2 PWA-ready

- `app/manifest.ts` (standalone, Hungarian, maskable icon), `viewport.themeColor`, apple-web-app meta, placeholder icon set.
- `public/sw.js`: network-first page, cache-first hashed assets, stale-while-revalidate data and icons, versioned caches, production-only registration, served `no-cache`.
- Verified locally against the production build: SW activates, 1 page + 10 assets + 4 data entries cached, and an offline reload is playable on the first visit.
- Design handover written: `docs/design/BRIEF.md` (icon/identity, dark theme, game-card states, constraints).
- Merged as #3 (`be7b7d1`). Production check the same day: manifest and `sw.js` served (`no-cache`), SW activated, offline reload playable on first visit, no CSP errors. Accept (a) met; (b) the phone install is the owner's.

## 2026-11-04 — Follow-up fix (#4)

- A regression from #2, found in final review: after a mouse click left focus on a control, digit and arrow shortcuts were ignored, and after confirming "Új játék" a later Enter re-opened the dialog. Now only Space/Enter defer to a focused, enabled control, and focus is released after a dialog *confirm*. A click on the dialog's own padding no longer counts as a backdrop click.

## 2026-11-04 — Custom domain

- Vercel project renamed to `j-vagy-ly` (owner). `j-vagy-ly.tmsso.com` attached; DNS-only CNAME added at Cloudflare (owner). Let's Encrypt certificate issued, Vercel config check clean.
- Verified on the new host: security headers, `sw.js` `no-cache`, manifest, SW activates, offline reload playable, keyboard/focus checks, no CSP errors. `j-or-ly.vercel.app` keeps serving (D5: no redirect).

## 2026-11-04 — Design handoff 01 committed

- Design pass 01 exported from the Claude Design canvas into `docs/design/handoff-01/`: icon master and favicon SVGs, the canvas index and all 13 artboard sources, plus a README with the token, type and manifest decisions. Implemented in the same PR (next entry).

## 2026-11-04 — Design pass 01 implemented (Phase 3)

- **Identity:** new icon master and favicon (`design/icon.svg`, `design/favicon.svg`); `scripts/generate-icons.mjs` renders the launcher icons from the master and `favicon-32` from the favicon. Manifest `theme_color` `#2C4AAE`, `background_color` `#F5F2EA`; `viewport.themeColor` per theme.
- **Tokens and dark mode:** colours are CSS variables in `app/globals.css` that flip under `prefers-color-scheme: dark`; Tailwind maps semantic names (`paper`, `card`, `ink`, `primary`, `success`, `error`, …) onto them, so one class works in both themes. Dark mode re-enabled (`color-scheme: light dark`). Every text pair checked at AA, both themes.
- **Type:** Literata 600/700 via `next/font` (self-hosted, `latin-ext`) for the answer words, wordmark and word chips; Inter for the UI. Both fonts now reach Tailwind through CSS variables (the old `font-sans: 'Inter'` named a family `next/font` never registers).
- **Layout and states:** phone header with score pill and "Új játék"; redesigned game card (answer states with icon + text label, feedback panel, lookup links), switch-style auto-advance toggle with running and "Megállítva" states, collapsible "Gyakorolandó szavak" (open by default) and "Hogyan működik?", "Eredmény" with a Top-3 that marks the running session ("ez a kör"), desktop keyboard reference and `kbd` hints, loading skeleton, error screen with a reload button, restyled dialogs, visible `:focus-visible` ring.
- **Motion:** `prefers-reduced-motion` neutralises the fade/slide animations and skips the confetti.
- **Deviations from the artboards (measured, not taste):** the two-column page starts at 1280 px rather than wrapping fluidly (narrower, the side-by-side answer buttons overflow on the widest words at desktop size); phone word sizes scale down below 390 px (overflow at 320 px); the dark switch "off" track is `#6B7486` instead of `#5B6475` (3:1 non-text contrast).
- Verified locally on `next start`: lint, typecheck, 28 Jest + 7 Python tests, build; light/dark × phone/desktop screenshots against the artboards; no answer-word overflow for the widest pairs of each size step from 320 to 1440 px; v1 migration, rounds, dialogs, focus cases, SW + offline reload, mastery confetti (and none under reduced motion), no CSP errors.

