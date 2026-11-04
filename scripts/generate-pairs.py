#!/usr/bin/env python3
"""Generate j/ly practice pairs from the Hungarian word list.

Reads data/magyar-szavak.txt and writes public/jly-pairs.json: a list of
{"correct": ..., "wrong": ...} objects, plus "bothCorrect": true when the
"wrong" variant is itself a dictionary word (e.g. hej / hely).

For every occurrence of j or ly in a word, one wrong variant is made by
swapping that single occurrence:

    jj  -> lly    (the doubled forms: "lly" is the doubled "ly")
    lly -> jj
    ly  -> j      (except the "ly" inside an "lly", handled above)
    j   -> ly     (except a "j" inside a "jj", handled above)

The output is deterministic: the same input gives a byte-identical file, so
CI can check that the committed JSON is up to date.
"""
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

MAX_WORD_LENGTH = 15  # Must match MAX_WORD_LENGTH in app/utils/pairs.ts

# Lower-case Hungarian letters, plus space and hyphen. The space admits
# multi-word dictionary entries ("dán királyság"); see IDEAS.md.
HUNGARIAN_ALPHA = "aábcdeéfghiíjklmnoóöőpqrstuúüűvwxyz -"
RE_INVALID = re.compile(f"[^{re.escape(HUNGARIAN_ALPHA)}]")

ROOT = Path(__file__).resolve().parent.parent
WORDS_PATH = ROOT / "data" / "magyar-szavak.txt"
OUTPUT_PATH = ROOT / "public" / "jly-pairs.json"


def is_valid_word(word: str) -> bool:
    return (
        not RE_INVALID.search(word)
        and not word.startswith("-")
        and not word.endswith("-")
        and len(word) <= MAX_WORD_LENGTH
    )


def load_words(path: Path = WORDS_PATH) -> List[str]:
    with path.open("r", encoding="utf-8") as f:
        words = [line.strip().lower() for line in f if line.strip()]
    return [w for w in words if is_valid_word(w)]


def swap_candidates(word: str) -> List[Tuple[int, str, str]]:
    """(index, source, target) for every single j/ly swap in the word."""
    swaps: List[Tuple[int, str, str]] = []
    for m in re.finditer("jj", word):
        swaps.append((m.start(), "jj", "lly"))
    for m in re.finditer("lly", word):
        swaps.append((m.start(), "lly", "jj"))
    for m in re.finditer("ly", word):
        inside_lly = m.start() > 0 and word[m.start() - 1] == "l"
        if not inside_lly:
            swaps.append((m.start(), "ly", "j"))
    for m in re.finditer("j", word):
        i = m.start()
        inside_jj = (i > 0 and word[i - 1] == "j") or (i + 1 < len(word) and word[i + 1] == "j")
        if not inside_jj:
            swaps.append((i, "j", "ly"))
    return swaps


def generate_jly_pairs(words: List[str]) -> List[Dict]:
    word_set = set(words)
    seen = set()  # unordered {a, b}, so "hej/hely" is not also emitted as "hely/hej"
    pairs = []
    for word in words:
        used_indices = set()
        for index, source, target in swap_candidates(word):
            if index in used_indices:
                continue
            wrong = word[:index] + target + word[index + len(source):]
            if len(wrong) > MAX_WORD_LENGTH:
                continue  # Would not fit the buttons; the app filters these anyway
            key = tuple(sorted((word, wrong)))
            if key in seen:
                continue
            seen.add(key)
            used_indices.add(index)
            pair = {"correct": word, "wrong": wrong}
            if wrong in word_set:
                pair["bothCorrect"] = True
            pairs.append(pair)
    return sorted(pairs, key=lambda p: (p["correct"], p["wrong"]))


def main() -> None:
    words = load_words()
    pairs = generate_jly_pairs(words)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Minified: the file is fetched by every visitor and cached by the service worker.
    OUTPUT_PATH.write_text(
        json.dumps(pairs, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8"
    )
    print(f"{len(words)} valid words -> {len(pairs)} pairs -> {OUTPUT_PATH.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
