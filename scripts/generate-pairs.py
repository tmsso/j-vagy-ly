#!/usr/bin/env python3
"""
Generate j/ly pairs from magyar-szavak.txt and output as JSON.
"""
import json
from pathlib import Path

def load_words(path: str | Path) -> list[str]:
    """Load normalized lowercase words from file, one per line."""
    p = Path(path)
    with p.open("r", encoding="utf-8") as f:
        words = [line.strip().lower() for line in f if line.strip()]
    return words

def _swap_at_index(word: str, index: int, source: str, target: str) -> str:
    return word[:index] + target + word[index + len(source) :]

def generate_j_ly_pairs(words: list[str]) -> list[tuple[str, str]]:
    """Generate (correct, wrong) pairs for words containing j/ly."""
    word_set = set(words)
    pairs: set[tuple[str, str]] = set()

    for word in words:
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

def main():
    data_path = Path(__file__).parent.parent / "data" / "magyar-szavak.txt"
    output_path = Path(__file__).parent.parent / "public" / "jly-pairs.json"
    
    print(f"Loading words from {data_path}")
    words = load_words(data_path)
    print(f"Loaded {len(words)} words")
    
    pairs = generate_j_ly_pairs(words)
    print(f"Generated {len(pairs)} j/ly pairs")
    
    # Convert to list of objects for JSON
    pair_objects = [{"correct": c, "wrong": w} for c, w in pairs]
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(pair_objects, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {output_path}")
    
    # Print some examples
    print("\nExample pairs:")
    for i, p in enumerate(pair_objects[:5]):
        print(f"  {i+1}. {p['correct']} -> {p['wrong']}")

if __name__ == "__main__":
    main()