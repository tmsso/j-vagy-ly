# Design brief — J vagy LY? (design pass 01, ROADMAP Phase 3)

Handover for a design pass (Claude Design or a human designer). The app works, is hardened (Phase 1) and is installable/offline (Phase 2). Its look is still the first-draft Tailwind defaults, its icon is a generated placeholder, and dark mode is switched off because the draft broke under it. This brief lists what to design, what exists, and the constraints. The resulting handoff goes in `docs/design/handoff-01/` and becomes an implementation batch.

## The product in a paragraph

A Hungarian spelling-practice game for one notorious trap: `j` versus `ly`, which sound identical today and are distinguished only by convention. Each round shows two spellings of a word (`folyó` / `fojó`), and the player taps the right one. Words they miss come back more often until they are learned. It should feel **calm, quick and encouraging**: a two-minute practice on the tram, or a classroom warm-up, not a high-pressure quiz. No accounts, no ads, no tracking. The UI is entirely in **Hungarian**.

**Audience:** native speakers of all ages who want to stop second-guessing (school children through adults), plus teachers projecting it in class. Larger, legible type matters more than density.

## What exists today (live: `https://j-or-ly.vercel.app`)

One page (`app/page.tsx`) with:

1. **Header:** "J vagy **LY**?" wordmark.
2. **Game card** (`GameCard.tsx`): the question "Melyik a helyes?", two large option buttons, then a feedback panel after answering (correct/incorrect, the right spelling, a "Mi az, hogy …?" lookup link).
3. **Next button** with an auto-advance countdown bar, plus an opt-out checkbox.
4. **Failed-word list** (collapsible chips: red = backlog, green = nearly learned; a tap opens a remove dialog).
5. **Side column:** a Top-3 card, a score panel (correct / total / accuracy, a bar, the "Új játék" button) and a "Hogyan működik?" instructions card.
6. **Dialogs** (`ConfirmDialog.tsx`, native `<dialog>`): new game, remove word.
7. **Confetti** when a failed word is mastered.

The design tokens are the Tailwind config (`tailwind.config.ts`: `primary` sky blues, `success` green, `error` red), plus `.btn-*` classes in `app/globals.css`. Treat the values as replaceable. Keep the semantic names (`primary`, `success`, `error`) so the implementation stays a token swap rather than a rewrite.

## What to design

### 1. App icon and identity (required, blocking)

- An app icon that reads at 32 px (tab) and on a phone home screen. It must work as a **maskable** icon: full-bleed background, with the meaningful shape inside the central ~60% safe zone, since Android crops it to circles or squircles.
- Deliver an SVG master. The engineering side renders it to `public/icons/*` with `scripts/generate-icons.mjs` (currently from the placeholder `design/icon.svg`).
- `theme_color` / `background_color` for the manifest and the browser chrome (now `#0284c7` / `#f0f9ff`).
- Optionally a refreshed wordmark for the header.

### 2. Dark theme (required)

Currently forced off (`colorScheme: "light"` in `app/layout.tsx`). The draft hard-coded white cards, so OS dark mode left near-white text on white. Needed: a dark palette for every surface and state below, with AA contrast. The red/green answer states must stay distinguishable in both themes.

### 3. The game card: the screen that matters

Phone-first, one-handed. States to design:

- **Unanswered:** two options, equal weight, no hint of which is right. Words run from 3 to 15 characters, and the type size steps down with length (4 steps today). Show the longest case, e.g. `ablakmélyedés`.
- **Answered, correct.**
- **Answered, wrong:** the chosen option marked wrong, the right one marked right.
- **Both correct** (`hej` / `hely`: both real words): "Mindkettő helyes! :)".
- **Auto-advance countdown running**, and cancelled.

Colour must never be the only signal (the ✅/❌ text labels exist today; keep an equivalent).

### 4. Progress and feedback surfaces

Score panel, Top-3 and the failed-word chips (backlog vs green). Today they are three generic white cards. One question for the designer: should the side column collapse below the game on phones (it does today, as a long scroll)? Is a compact header strip better?

### 5. Smaller states

- Loading ("Betöltés...").
- **Load error / offline without a cache:** "A játék betöltése nem sikerült…" (`role="alert"`).
- The dialogs.
- An empty failed-word list ("Nincs elhibázott szó.").

## Constraints

- **Hungarian copy is fixed in meaning.** Wording tweaks are welcome. The content must stay factually correct: there is **no pronunciation or vowel-harmony rule** for j/ly, so do not add "tips" that imply one. Word-family hints (hely → helyes) are fine.
- **Offline and installable.** No web fonts, images or scripts from other origins. The CSP is `'self'`-only. Fonts are self-hosted via `next/font` (Inter today, with `latin-ext` for ő/ű).
- **Touch targets** of at least 44 px. Answer buttons stay large.
- **Keyboard:** `1`/`2`/arrows, `Enter`/`Space`, `N`, `Esc` must keep working, and visible focus styles are needed (today's are browser defaults).
- **Motion:** respect `prefers-reduced-motion` (the confetti and slide-in animations ignore it today).
- **No accounts, no social features.** Nothing should imply a profile or a login.

## Engineering notes for the implementation batch

- Re-enable dark mode by removing `colorScheme: "light"` and the `:root { color-scheme: light }` block, then add a `dark:` variant strategy in Tailwind.
- Swap `design/icon.svg`, run `node scripts/generate-icons.mjs`, and update the manifest colours in `app/manifest.ts` and `viewport.themeColor`.
- Any new font must come through `next/font` (self-hosted).
- Bump `VERSION` in `public/sw.js` only if the caching logic changes; new assets are picked up automatically.
