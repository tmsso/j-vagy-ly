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
