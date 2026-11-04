// Persistence for the game: localStorage access, validation and schema migration.
//
// Everything read from localStorage is treated as untrusted input: an older app
// version, a browser extension or a manual edit can leave anything there, and a
// malformed record must never crash the game. The parse/validate functions are
// pure (they take raw strings) so they can be unit-tested without a browser.

import type { FailedWords, FailedWordStat } from './gameLogic';
import { JLyPair, pairKey } from './pairs';

export const MAX_HIGH_SCORES = 3;

export const STORAGE_KEYS = {
  failedWords: 'jly:v2:failedWords',
  highScores: 'jly:v2:highScores',
  // Score of the session in progress; folded into the high scores when the
  // next session starts. This avoids relying on unload events, which mobile
  // browsers and installed PWAs often don't fire.
  currentSession: 'jly:v2:currentSession',
} as const;

/** Keys from the 2026-05 app version (v1), read once for migration and then removed. */
export const LEGACY_KEYS = {
  failedWords: 'j_ly_failed_words',
  highScores: 'j_ly_high_scores',
} as const;

function safeJsonParse(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0;

/**
 * Validates failed-word records and re-points them at the canonical pair from
 * the current dataset. Records for pairs no longer in the dataset are dropped.
 * Accepts both v2 (keyed by pairKey) and v1 (keyed by correct word) shapes,
 * because each record carries its pair: the key is always rebuilt from it.
 */
export function parseFailedWords(raw: string | null, knownPairs: Map<string, JLyPair>): FailedWords {
  const data = safeJsonParse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

  const result: FailedWords = {};
  for (const value of Object.values(data as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') continue;
    const v = value as Record<string, unknown>;
    const p = v.pair as Record<string, unknown> | undefined;
    if (!p || typeof p.correct !== 'string' || typeof p.wrong !== 'string') continue;

    const key = pairKey({ correct: p.correct, wrong: p.wrong });
    const pair = knownPairs.get(key);
    if (!pair) continue;

    const stat: FailedWordStat = {
      pair,
      stage: v.stage === 'green' ? 'green' : 'backlog',
      gameIndexFailedAt: isCount(v.gameIndexFailedAt) ? v.gameIndexFailedAt : 0,
      consecutiveCorrect: isCount(v.consecutiveCorrect) ? v.consecutiveCorrect : 0,
      sessionCorrect: isCount(v.sessionCorrect) ? v.sessionCorrect : 0,
    };
    result[key] = stat;
  }
  return result;
}

export function parseHighScores(raw: string | null): number[] {
  const data = safeJsonParse(raw);
  if (!Array.isArray(data)) return [];
  return topScores(data.filter(isCount));
}

export function parseCurrentSession(raw: string | null): number {
  const data = safeJsonParse(raw) as { score?: unknown } | undefined;
  return data && isCount(data.score) ? data.score : 0;
}

/** Best MAX_HIGH_SCORES scores, highest first. Zero is not a score worth listing. */
export function topScores(scores: number[]): number[] {
  return scores
    .filter((s) => s > 0)
    .sort((a, b) => b - a)
    .slice(0, MAX_HIGH_SCORES);
}

export interface RankedScore {
  score: number;
  /** True for the session in progress ("ez a kör" in the UI). */
  isCurrent: boolean;
}

/**
 * The Top-3 list as displayed: finished sessions plus the running one, with the
 * running one marked. On a tie the finished score ranks first, so the running
 * session only shows as a new entry once it has actually beaten it.
 */
export function rankScores(saved: number[], current: number): RankedScore[] {
  return [...saved.map((score) => ({ score, isCurrent: false })), { score: current, isCurrent: true }]
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score) // Array.sort is stable: ties keep saved-before-current
    .slice(0, MAX_HIGH_SCORES);
}

// ---- Browser side -------------------------------------------------------

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // Storage disabled (private mode, blocked site data)
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Quota or disabled storage: progress just isn't saved.
  }
}

export interface LoadedProgress {
  failedWords: FailedWords;
  highScores: number[];
}

/**
 * Reads saved progress, migrating v1 keys on first run, and folds the previous
 * session's score into the high scores.
 */
export function loadProgress(pairs: JLyPair[]): LoadedProgress {
  const known = new Map(pairs.map((p) => [pairKey(p), p]));

  let failedRaw = read(STORAGE_KEYS.failedWords);
  let savedScores = parseHighScores(read(STORAGE_KEYS.highScores));
  if (failedRaw === null && read(STORAGE_KEYS.highScores) === null) {
    // v1 → v2 migration. parseFailedWords re-keys v1 records by pair.
    failedRaw = read(LEGACY_KEYS.failedWords);
    // v1 recorded every intermediate score of a session (12, 11, 10 for one
    // session of 12), so only its best value is a genuine session result.
    savedScores = parseHighScores(read(LEGACY_KEYS.highScores)).slice(0, 1);
  }

  const failedWords = parseFailedWords(failedRaw, known);
  const previousSession = parseCurrentSession(read(STORAGE_KEYS.currentSession));
  const highScores = topScores([...savedScores, previousSession]);

  saveFailedWords(failedWords);
  saveHighScores(highScores);
  write(STORAGE_KEYS.currentSession, null);
  write(LEGACY_KEYS.failedWords, null);
  write(LEGACY_KEYS.highScores, null);

  return { failedWords, highScores };
}

export function saveFailedWords(failedWords: FailedWords): void {
  write(STORAGE_KEYS.failedWords, JSON.stringify(failedWords));
}

export function saveHighScores(scores: number[]): void {
  write(STORAGE_KEYS.highScores, JSON.stringify(scores));
}

export function saveCurrentSession(score: number): void {
  write(STORAGE_KEYS.currentSession, JSON.stringify({ score }));
}
