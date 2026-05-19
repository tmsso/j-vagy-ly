#!/usr/bin/env python3
import json
import re
from pathlib import Path

# Hungarian alphabet + dash
HUNGARIAN_ALPHA = "aábcdeéfghiíjklmnoóöőpqrst uúüűvwxyz-"
RE_CLEAN = re.compile(f"[^{HUNGARIAN_ALPHA}]")

def is_valid_word(word: str) -> bool:
    # No non-alpha characters (like slash, colon etc.)
    if RE_CLEAN.search(word):
        return False
    # No dash at beginning or end
    if word.startswith("-") or word.endswith("-"):
        return False
    # Max length 15 (per previously implemented requirement)
    if len(word) > 15:
        return False
    return True

def _swap_at_index(word: str, index: int, source: str, target: str) -> str:
    return word[:index] + target + word[index + len(source) :]

def generate_pairs(words: list[str]) -> list[dict]:
    word_set = set(words)
    pairs = []
    seen = set()

    for word in words:
        if not is_valid_word(word):
            continue

        local_alternatives = []
        
        # Rule: jj <-> lly
        for sub_idx in [m.start() for m in re.finditer('jj', word)]:
            local_alternatives.append((sub_idx, 'jj', 'lly'))
        for sub_idx in [m.start() for m in re.finditer('lly', word)]:
            local_alternatives.append((sub_idx, 'lly', 'jj'))
            
        # Rule: j <-> ly (only single occurrences, avoiding overlap with double letters)
        # Check 'ly'
        start = 0
        while True:
            idx = word.find("ly", start)
            if idx == -1: break
            # Don't overlap with 'lly' swap already handled? 
            # Actually simpler to just swap all found tokens
            local_alternatives.append((idx, 'ly', 'j'))
            start = idx + 2
        
        # Check 'j'
        for idx, ch in enumerate(word):
            if ch == "j":
                # Ensure it's not part of 'jj' handled above
                if (idx > 0 and word[idx-1] == 'j') or (idx < len(word)-1 and word[idx+1] == 'j'):
                    continue
                local_alternatives.append((idx, "j", "ly"))

        for idx, src, tgt in local_alternatives:
            wrong = _swap_at_index(word, idx, src, tgt)
            if wrong == word:
                continue
            
            # Key to de-duplicate
            key = tuple(sorted([word, wrong]))
            if key in seen:
                continue
            seen.add(key)

            is_both_correct = wrong in word_set
            pairs.append({
                "correct": word,
                "wrong": wrong,
                "bothCorrect": is_both_correct
            })

    return sorted(pairs, key=lambda x: x["correct"])

def main():
    data_path = Path(__file__).parent.parent / "data" / "magyar-szavak.txt"
    output_path = Path(__file__).parent.parent / "public" / "jly-pairs.json"
    
    print(f"Loading words from {data_path}")
    with data_path.open("r", encoding="utf-8") as f:
        words = [line.strip().lower() for line in f if line.strip()]
    
    print(f"Loaded {len(words)} words. Generating pairs...")
    pair_objects = generate_pairs(words)
    print(f"Generated {len(pair_objects)} j/ly pairs")
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(pair_objects, f, ensure_ascii=False, indent=2)
    
    print(f"Saved to {output_path}")

if __name__ == "__main__":
    main()
