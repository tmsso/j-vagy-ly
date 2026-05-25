#!/usr/bin/env python3
import json
import re
import random
from pathlib import Path
from typing import List, Dict, Tuple

# --- Configuration ---
MAX_WORD_LENGTH = 15
NEW_GAME_CONFIRMATION_STORAGE_KEY = "jly_confirm_new_game"
HIGH_SCORES_STORAGE_KEY = "jly_high_scores"
FAILED_WORDS_STORAGE_KEY = "jly_failed_words"
MAX_HIGH_SCORES = 3
FAILED_WORD_PROBABILITY_MULTIPLIER = 100
FAILED_WORD_REAPPEAR_DELAY = 5 # The number of words to appear after failing before reappearing

# --- Initial Word List Processing ---
HUNGARIAN_ALPHA = "aábcdeéfghiíjklmnoóöőpqrst uúüűvwxyz-"
RE_CLEAN = re.compile(f"[^{HUNGARIAN_ALPHA}]")

def is_valid_word(word: str) -> bool:
    """Checks if a word is valid based on application requirements."""
    if RE_CLEAN.search(word):
        return False
    if word.startswith("-") or word.endswith("-"):
        return False
    if len(word) > MAX_WORD_LENGTH:
        return False
    return True

def load_words(data_dir: Path) -> List[str]:
    """Loads and filters words from the dictionary file."""
    path = data_dir / "magyar-szavak.txt"
    print(f"Loading words from {path}")
    with path.open("r", encoding="utf-8") as f:
        words = [line.strip().lower() for line in f if line.strip()]
    
    valid_words = [word for word in words if is_valid_word(word)]
    print(f"Loaded {len(words)} words, {len(valid_words)} valid (<= {MAX_WORD_LENGTH} chars).")
    return valid_words

# --- J/LY Pair Generation ---
def _swap_at_index(word: str, index: int, source: str, target: str) -> str:
    """Swaps a substring at a given index."""
    return word[:index] + target + word[index + len(source) :]

def generate_jly_pairs(words: List[str]) -> List[Dict]:
    """Generates j/ly word pairs and their validity."""
    word_set = set(words)
    pairs = []
    seen_pairs = set() # Use a set to store sorted tuples of (word1, word2) to avoid duplicates

    # Prioritize rules that are less ambiguous
    # Rule: jj <-> lly
    # Rule: j <-> ly

    for word in words:
        # Pre-process word for potential swaps
        potential_swaps: List[Tuple[int, str, str]] = []

        # Find 'jj' and map to 'lly'
        for match in re.finditer('jj', word):
            potential_swaps.append((match.start(), 'jj', 'lly'))
        
        # Find 'lly' and map to 'jj'
        for match in re.finditer('lly', word):
            potential_swaps.append((match.start(), 'lly', 'jj'))
        
        # Find 'ly' and map to 'j'
        # Use a robust find method that avoids partial matches and overlapping
        current_pos = 0
        while current_pos < len(word):
            match = re.search(r'ly', word[current_pos:])
            if match:
                idx = current_pos + match.start()
                # Avoid conflicts with 'lly' if already processed
                if not (idx > 0 and word[idx-1] == 'l') or (idx + 2 < len(word) and word[idx+2] == 'y'): # This logic is complicated, let's refine
                    # Best to check for 'lly' first, then 'ly'
                    # For now, let's just add and deduplicate later
                    potential_swaps.append((idx, 'ly', 'j'))
                current_pos = idx + 2
            else:
                break
        
        # Find 'j' and map to 'ly'
        current_pos = 0
        while current_pos < len(word):
            match = re.search(r'j', word[current_pos:])
            if match:
                idx = current_pos + match.start()
                # Avoid conflicts with 'jj'
                if not (idx > 0 and word[idx-1] == 'j') and not (idx < len(word)-1 and word[idx+1] == 'j'):
                    potential_swaps.append((idx, 'j', 'ly'))
                current_pos = idx + 1
            else:
                break

        # Process unique potential swaps to create pairs
        added_indices = set() # Track indices processed to avoid duplicate swap attempts
        for idx, src, tgt in potential_swaps:
            if idx in added_indices:
                continue

            wrong_word = _swap_at_index(word, idx, src, tgt)
            if wrong_word == word: # Swap didn't change the word
                continue

            # Create a canonical key for the pair to ensure uniqueness
            canonical_pair = tuple(sorted([word, wrong_word]))
            
            if canonical_pair not in seen_pairs:
                is_both_correct = wrong_word in word_set
                pairs.append({
                    "correct": word,
                    "wrong": wrong_word,
                    "bothCorrect": is_both_correct
                })
                seen_pairs.add(canonical_pair)
                added_indices.add(idx) # Mark this index as processed for this word

    # Sort pairs by the 'correct' word for consistency
    return sorted(pairs, key=lambda x: x["correct"])

def main():
    data_dir = Path(__file__).parent.parent / "data"
    output_dir = Path(__file__).parent.parent / "public"
    output_path = output_dir / "jly-pairs.json"
    
    valid_words = load_words(data_dir)
    
    print(f"Generating pairs for {len(valid_words)} words...")
    pair_objects = generate_jly_pairs(valid_words)
    print(f"Generated {len(pair_objects)} j/ly pairs.")
    
    output_dir.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as f:
        json.dump(pair_objects, f, ensure_ascii=False, indent=2)
    
    print(f"Saved pairs to {output_path}")

if __name__ == "__main__":
    main()
