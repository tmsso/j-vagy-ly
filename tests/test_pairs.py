from pathlib import Path
import sys

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.pairs import generate_j_ly_pairs


def test_generate_pairs_excludes_existing_real_words():
    words = ["folyó", "fojó", "hajó"]
    pairs = generate_j_ly_pairs(words)
    assert ("folyó", "fojó") not in pairs


def test_generate_pairs_has_j_source_and_ly_source_cases():
    words = ["folyó", "hajó", "háló"]
    pairs = generate_j_ly_pairs(words)

    assert any(correct == "folyó" for correct, _ in pairs)
    assert any(correct == "hajó" for correct, _ in pairs)


def test_wrong_variant_is_not_identical():
    words = ["folyó", "hajó"]
    pairs = generate_j_ly_pairs(words)
    assert all(correct != wrong for correct, wrong in pairs)
