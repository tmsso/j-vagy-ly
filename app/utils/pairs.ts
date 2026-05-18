export interface JLyPair {
  correct: string;
  wrong: string;
}

let cachedPairs: JLyPair[] | null = null;

export async function loadPairs(): Promise<JLyPair[]> {
  if (cachedPairs) {
    return cachedPairs;
  }
  
  try {
    const response = await fetch('/jly-pairs.json');
    if (!response.ok) {
      throw new Error(`Failed to load pairs: ${response.status}`);
    }
    const data = await response.json();
    cachedPairs = data;
    return data;
  } catch (error) {
    console.error('Error loading j/ly pairs:', error);
    // Fallback to empty array
    return [];
  }
}

export function getRandomPair(pairs: JLyPair[]): JLyPair {
  if (pairs.length === 0) {
    return { correct: 'folyó', wrong: 'fojó' };
  }
  return pairs[Math.floor(Math.random() * pairs.length)];
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}