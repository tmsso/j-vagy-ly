# Plan: Web App for Practicing Hungarian `j` vs `ly`

## 1) Goal
Build a simple web-based practice game where players choose the correct spelling between two alternatives that differ only by `j`/`ly` usage (e.g., `folyó` vs `fojó`).

## 2) Input Data
Use `data/magyar-szavak.txt` as the source list of Hungarian words.

### Data preparation workflow
1. Load all words from `magyar-szavak.txt`.
2. Keep only candidate words containing either `j` or `ly`.
3. Build **valid -> invalid** pairs:
   - If a valid word contains `ly`, create wrong form by replacing one `ly` with `j`.
   - If a valid word contains `j`, create wrong form by replacing one `j` with `ly`.
4. Exclude generated wrong forms that also exist as real words in the dictionary (to avoid ambiguous/actually-correct alternatives).
5. Deduplicate pairs and store as in-memory list or generated JSON cache.

## 3) Game Mechanics
Per round:
1. Select one pair `(correct, wrong)` randomly.
2. Randomize button order.
3. Player clicks one of two options.
4. Immediate feedback:
   - Correct: +1 score
   - Wrong: mark miss, optionally show explanation text: "A helyes alak: ..."
5. Move to next round.

Session state:
- `score_correct`
- `score_total`
- `current_round`
- `recent_answers` (optional history)

Optional difficulty modes:
- Normal: fully random pairs
- Focus mode: repeat previously missed words more frequently

## 4) UI/UX (Web)
Recommended structure:
- Header/title: "J vagy LY?"
- Short instruction in Hungarian
- Center card with two large answer buttons
- Feedback line under buttons
- Score panel (e.g., `7 / 10`)
- Controls: "Következő szó", "Új játék"

Accessibility and usability:
- Keyboard shortcuts (`1`/`2`)
- High contrast buttons
- Mobile-friendly responsive layout

## 5) Technical Implementation
Suggested stack: **Streamlit** (already present in repo) for fast delivery.

Proposed modules:
- `app/jly_game.py` (main UI/game loop)
- `app/pairs.py` (pair generation from dictionary)
- `tests/test_pairs.py` (rules and edge-case tests)

Core functions:
- `load_words(path) -> list[str]`
- `generate_j_ly_pairs(words) -> list[tuple[str, str]]`
- `is_safe_wrong_variant(wrong, word_set) -> bool`
- `next_question(pairs, rng) -> Question`

## 6) Quality Gates
Before release:
1. Unit tests for pair generator:
   - wrong variant is not identical to correct
   - wrong variant not in dictionary
   - both `j` and `ly` source words are covered
2. Smoke test app launch
3. Manual gameplay test (>=30 rounds)

## 7) Deployment & Branching under `tmsso`
Use a dedicated feature branch and publish to `tmsso` remote.

Suggested git flow:
1. `git checkout -b tmsso/j-ly-word-practice`
2. Implement app + tests
3. `git add ... && git commit -m "Add j/ly Hungarian spelling practice web app"`
4. `git push -u tmsso tmsso/j-ly-word-practice`
5. Deploy from that branch according to hosting target (e.g., Streamlit Cloud, Render, Hugging Face Spaces)

If Streamlit Cloud is used:
- Point app entrypoint to `app/jly_game.py`
- Configure branch: `tmsso/j-ly-word-practice`

## 8) Milestones
- **M1 (Data):** Pair generation pipeline complete and validated
- **M2 (Gameplay):** Round flow + scoring complete
- **M3 (UX):** Feedback, controls, responsive layout complete
- **M4 (Release):** Tests green, branch pushed to `tmsso`, deployment configured

## 9) Future Enhancements
- Spaced repetition for errors
- Streaks and achievements
- Timed mode
- Teacher dashboard/export of mistakes
- Audio pronunciation support
