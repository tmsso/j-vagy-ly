export interface JLyPair {
  correct: string;
  wrong: string;
  bothCorrect?: boolean;
}

/** Longest word the buttons are designed for (see the font-size steps in GameCard). */
export const MAX_WORD_LENGTH = 15;

/**
 * Stable identity of a pair. The same correct word can have several wrong
 * variants (e.g. a j in two positions), so the correct word alone is not unique.
 */
export function pairKey(pair: Pick<JLyPair, 'correct' | 'wrong'>): string {
  return `${pair.correct}|${pair.wrong}`;
}

function isPair(value: unknown): value is JLyPair {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.correct === 'string' && typeof v.wrong === 'string' && v.correct !== v.wrong;
}

/** Keeps well-formed pairs that fit the buttons. Exported for tests. */
export function sanitizePairs(data: unknown): JLyPair[] {
  if (!Array.isArray(data)) return [];
  return data
    .filter(isPair)
    .filter((pair) => pair.correct.length <= MAX_WORD_LENGTH && pair.wrong.length <= MAX_WORD_LENGTH)
    .map((pair) => ({ correct: pair.correct, wrong: pair.wrong, ...(pair.bothCorrect ? { bothCorrect: true } : {}) }));
}

let cachedPairs: JLyPair[] | null = null;

/**
 * Loads the generated pairs. Throws on failure (network, bad JSON, empty set)
 * so the page can show an error message. An empty pool would otherwise crash
 * the game later on with a much less helpful error.
 */
export async function loadPairs(): Promise<JLyPair[]> {
  if (cachedPairs) return cachedPairs;

  const response = await fetch('/jly-pairs.json');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const pairs = sanitizePairs(await response.json());
  if (pairs.length === 0) {
    throw new Error('üres szólista');
  }
  cachedPairs = pairs;
  return pairs;
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
