from __future__ import annotations

from pathlib import Path
from typing import Iterable


def load_words(path: str | Path) -> list[str]:
    """Load normalized lowercase words from file, one per line."""
    p = Path(path)
    with p.open("r", encoding="utf-8") as f:
        words = [line.strip().lower() for line in f if line.strip()]
    return words


def _swap_at_index(word: str, index: int, source: str, target: str) -> str:
    return word[:index] + target + word[index + len(source) :]


def generate_j_ly_pairs(words: Iterable[str]) -> list[tuple[str, str]]:
    """Generate (correct, wrong) pairs for words containing j/ly.

    Wrong alternatives are filtered if they are valid words in the dictionary.
    """
    word_list = [w.lower() for w in words]
    word_set = set(word_list)
    pairs: set[tuple[str, str]] = set()

    for word in word_list:
        if "ly" in word:
            start = 0
            while True:
                idx = word.find("ly", start)
                if idx == -1:
                    break
                wrong = _swap_at_index(word, idx, "ly", "j")
                if wrong != word and wrong not in word_set:
                    pairs.add((word, wrong))
                start = idx + 2

        if "j" in word:
            for idx, ch in enumerate(word):
                if ch == "j":
                    wrong = _swap_at_index(word, idx, "j", "ly")
                    if wrong != word and wrong not in word_set:
                        pairs.add((word, wrong))

    return sorted(pairs)
