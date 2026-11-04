// Small pure helpers for presentation decisions, kept out of the components so
// they can be unit-tested.

/**
 * Type-size step for the two answer words, chosen from the longer option so both
 * buttons use the same size (design handoff 01): 0 = up to 9 letters, 1 = 10–12,
 * 2 = 13–14, 3 = 15 or more.
 */
export function wordSizeStep(longestLength: number): 0 | 1 | 2 | 3 {
  if (longestLength <= 9) return 0;
  if (longestLength <= 12) return 1;
  if (longestLength <= 14) return 2;
  return 3;
}
