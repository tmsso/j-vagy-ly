# IDEAS.md — J vagy LY?

Loose backlog. Nothing here is scheduled; `ROADMAP.md` is the plan. Pick things up opportunistically or promote them into a phase.

## Content and data quality

- **Word-initial `ly` giveaways.** Only a handful of Hungarian words start with `ly` (lyuk, lyukas, …), so wrong forms like "lyáromív" are trivially rejected. Option: skip `j→ly` swaps at position 0 unless the source word is itself one of the real `ly-` words.
- **Curate the dictionary.** `data/magyar-szavak.txt` (161,743 entries, from a public gist via Betűvető) has dubious forms that produce false `bothCorrect` pairs ("ezeregyélyszaka"). A small deny-list in the generator, or a cross-check against a second word list.
- **Multi-word entries** ("dán királyság") are in the pool because the generator alphabet allows a space. Decide whether they are welcome.
- **Frequency weighting.** Prefer common words over rare compounds — needs a frequency list.
- **Explanations.** A short etymology note per word family is the only honest "rule" for j/ly; even a few dozen hand-written notes for the most common traps would beat a search link.

## Gameplay

- **Defined game length** (e.g. 20 words per round) so "high score" means something comparable; today a session is open-ended and the score is just its correct count.
- **Streaks**, and a "today's practice" counter.
- **Review mode:** play only the failed-word backlog.
- **Timed mode.**
- **Audio pronunciation** via the browser's speech synthesis (no server needed).

## Technical

- **Progress transfer between hosts** (export/import code or link) — prerequisite for ever redirecting `j-or-ly.vercel.app` to `j-vagy-ly.tmsso.com` (ROADMAP D5).
- An end-to-end smoke test (Playwright) in CI, once the app is worth the extra CI minutes.
- Lighthouse budget check in CI.
- Tailwind 4 / TypeScript 7 / Jest 30 migrations: majors, not needed for hardening; revisit with the design pass.
- Teacher-facing export of mistake statistics (from the docs/REQUIREMENTS.md "future" list).
