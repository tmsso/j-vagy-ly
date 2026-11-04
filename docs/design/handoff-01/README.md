# Design handoff 01 — J vagy LY?

Output of design pass 01 (ROADMAP Phase 3), answering `docs/design/BRIEF.md`. Exported on 2026-11-04 from the project owner's Claude Design canvas "J vagy LY? — design pass 01" (version `1793803101-03b1`). This folder is a record of the design, not app code. Nothing here is built or served. The implementation batch reads it.

## Contents

- `assets/icon-master.svg`: the app icon master (512 × 512, full bleed, maskable). Two equal cards with "j" and "ly", kept inside the central 60% safe zone. It replaces the placeholder `design/icon.svg`.
- `assets/favicon.svg`: the small-size variant for 32 px and below. Letters only, no cards, rounded corners, so it stays legible in a browser tab.
- `canvas/canvas.json`: the canvas index (artboard titles, sizes and layout).
- `canvas/*.dc.html`: one file per artboard, as the canvas stores it:

| File | Shows |
|---|---|
| `Identity.dc.html` | Icon, masks and sizes, wordmark, manifest colours, colour tokens (light/dark), type scale |
| `Main.dc.html` | Phone, light, unanswered (13-letter word). Holds all the phone states, chosen by `theme` and `scenario` props |
| `PhoneCorrect` / `PhoneWrong` / `PhoneBoth` | Phone, light: correct with countdown, wrong, both correct |
| `PhoneDark` / `PhoneDarkCancelled` / `PhoneDarkWrong` / `PhoneDarkBoth` | The same in dark, plus countdown cancelled |
| `Desktop.dc.html`, `DesktopDark.dc.html` | Desktop layout, light (correct, countdown) and dark (wrong) |
| `States.dc.html`, `StatesDark.dc.html` | Loading, load error/offline, empty word list, both dialogs, keyboard focus |

The small `Phone*`, `*Dark` files only import `Main`, `Desktop` or `States` with different props.

## Reading the `.dc.html` files

They are Claude Design component sources. They need the canvas runtime (`support.js`) and will not render when opened directly. View them on the canvas, or read the markup: layout and colours are inline styles, and the per-theme token values sit in each file's `renderVals()`.

Image references of the form `/_blob/<id>` are canvas uploads:

- `/_blob/d729ee677d855d5bce9ca703f83c31f8` → `assets/icon-master.svg`
- `/_blob/8682030b32f2864cc6df905c35dae3bb` → `assets/favicon.svg`

## Key decisions (from `Identity.dc.html`)

- **Primary** moves from sky blue to indigo `#2C4AAE` (dark fills `#3F60CC`, dark text/links `#9DB3F5`). A warm paper ground `#F5F2EA` (dark `#11151D`).
- **Feedback** colours: success green `#1E8A63` / text `#136B4F`, error shifts to a burnt orange `#C4501F` / text `#A13C14`, so the two states also differ in lightness, not only hue. Dark values are in the token table.
- **Manifest:** `theme_color` `#2C4AAE`, `background_color` `#F5F2EA`. `viewport.themeColor` `#F5F2EA` (light) and `#11151D` (dark).
- **Type:** Literata 700 for the answer words, the wordmark and the word list; Inter stays for all UI text. Answer word size steps by the longer option's length: ≤ 9 letters 44/52 px (phone/desktop), 10–12: 34/40, 13–14: 30/34, 15: 28/32.
- **Wordmark:** "J vagy LY?" in Literata 700, only "LY" coloured. 24 px on phone, 36 px on desktop.

## Notes for the implementation batch

- The canvas loads Inter and Literata from Google Fonts to preview them. The app must not: the CSP is `'self'`-only and the game must work offline. Load Literata through `next/font` (self-hosted, `latin-ext` subset for ő/ű), like Inter.
- The "Mi az, hogy …?" links in the mockups use the same Google "define" search as the app today (`GameCard.tsx`). No change needed.
- Copy in the mockups (dialog text, empty-list hint, error help line) is a proposal. Check it against the brief's content rule before shipping.
