"""Tests for scripts/generate-pairs.py. Run: python3 -m unittest discover -s tests

Uses the standard-library unittest so CI and dev machines need no extra install.
"""
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_spec = importlib.util.spec_from_file_location("generate_pairs", ROOT / "scripts" / "generate-pairs.py")
gen = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(gen)


def as_tuples(pairs):
    return {(p["correct"], p["wrong"], p.get("bothCorrect", False)) for p in pairs}


class SwapRules(unittest.TestCase):
    def test_single_swaps(self):
        self.assertEqual(as_tuples(gen.generate_jly_pairs(["folyó"])), {("folyó", "fojó", False)})
        self.assertEqual(as_tuples(gen.generate_jly_pairs(["hajó"])), {("hajó", "halyó", False)})

    def test_doubled_forms_swap_as_a_unit(self):
        self.assertEqual(as_tuples(gen.generate_jly_pairs(["gally"])), {("gally", "gajj", False)})
        self.assertEqual(as_tuples(gen.generate_jly_pairs(["ujj"])), {("ujj", "ully", False)})

    def test_each_occurrence_gives_its_own_pair(self):
        self.assertEqual(
            as_tuples(gen.generate_jly_pairs(["jaj"])),
            {("jaj", "lyaj", False), ("jaj", "jaly", False)},
        )

    def test_real_word_variants_are_flagged_and_not_duplicated(self):
        pairs = gen.generate_jly_pairs(["hej", "hely"])
        self.assertEqual(as_tuples(pairs), {("hej", "hely", True)})

    def test_no_identity_pairs_and_length_limit(self):
        long_word = "a" * (gen.MAX_WORD_LENGTH - 1) + "j"  # its ly-variant is one char too long
        pairs = gen.generate_jly_pairs(["folyó", "hajó", long_word])
        self.assertTrue(all(p["correct"] != p["wrong"] for p in pairs))
        self.assertTrue(all(len(p["wrong"]) <= gen.MAX_WORD_LENGTH for p in pairs))
        self.assertNotIn(long_word, {p["correct"] for p in pairs})


class WordFilter(unittest.TestCase):
    def test_valid_words(self):
        self.assertTrue(gen.is_valid_word("folyó"))
        self.assertTrue(gen.is_valid_word("dán királyság"))
        self.assertFalse(gen.is_valid_word("-ság"))
        self.assertFalse(gen.is_valid_word("Folyó!"))
        self.assertFalse(gen.is_valid_word("a" * (gen.MAX_WORD_LENGTH + 1)))


class CommittedOutput(unittest.TestCase):
    def test_committed_json_matches_the_generator(self):
        """public/jly-pairs.json must be regenerated whenever the script or word list changes."""
        expected = gen.generate_jly_pairs(gen.load_words())
        committed = json.loads(gen.OUTPUT_PATH.read_text(encoding="utf-8"))
        self.assertEqual(committed, expected)


if __name__ == "__main__":
    unittest.main()
