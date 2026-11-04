// Pure game rules: no window, no storage, no React. Everything here is unit-tested
// (tests/gameLogic.test.ts); persistence lives in ./storage.ts.

import { JLyPair, pairKey, shuffleArray } from './pairs';

export const BACKLOG_INTERVAL = 4; // Every 4th question may come from the failed-word backlog
export const REAPPEAR_THRESHOLD = 5; // A failed word waits at least this many answers before returning
export const GREEN_THRESHOLD = 2; // Correct answers in a row to turn a failed word green
export const MASTERY_THRESHOLD = 4; // Correct answers (since the last miss) to remove it from the backlog

export type FailedWordStage = 'backlog' | 'green';

export interface FailedWordStat {
  pair: JLyPair;
  stage: FailedWordStage;
  gameIndexFailedAt: number; // Answer count when last seen, for the cool-down
  consecutiveCorrect: number; // For turning green
  sessionCorrect: number; // For mastery removal
}

/** Failed words keyed by pairKey(pair). */
export type FailedWords = Record<string, FailedWordStat>;

export interface GameState {
  pairs: JLyPair[];
  currentPair: JLyPair;
  shuffledOptions: string[];
  correctAnswers: number;
  totalAnswers: number;
  isAnswered: boolean;
  selectedAnswer: string | null;
  pairCount: number;
  failedWords: FailedWords;
  isCurrentFromBacklog: boolean;
  justMastered: string | null; // Triggers the confetti
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function isAnswerCorrect(pair: JLyPair, answer: string): boolean {
  return Boolean(pair.bothCorrect) || answer === pair.correct;
}

export function initializeGameState(pairs: JLyPair[], savedFailedWords: FailedWords = {}): GameState {
  if (pairs.length === 0) {
    throw new Error('Nincs betölthető szópár.');
  }
  const initialPair = randomItem(pairs);

  // A new session treats every saved word as fresh backlog (stats kept, ready to appear).
  const failedWords: FailedWords = {};
  for (const [key, stat] of Object.entries(savedFailedWords)) {
    failedWords[key] = { ...stat, stage: 'backlog', gameIndexFailedAt: 0, consecutiveCorrect: 0 };
  }

  return {
    pairs,
    currentPair: initialPair,
    shuffledOptions: shuffleArray([initialPair.correct, initialPair.wrong]),
    correctAnswers: 0,
    totalAnswers: 0,
    isAnswered: false,
    selectedAnswer: null,
    pairCount: pairs.length,
    failedWords,
    isCurrentFromBacklog: false,
    justMastered: null,
  };
}

export function selectAnswer(state: GameState, answer: string): GameState {
  if (state.isAnswered) return state;

  const isCorrect = isAnswerCorrect(state.currentPair, answer);
  const key = pairKey(state.currentPair);
  // Copy the record *and* the touched entry: the previous state must stay untouched,
  // otherwise React (and StrictMode's double invocation) sees stale, double-counted stats.
  const failedWords: FailedWords = { ...state.failedWords };
  let justMastered: string | null = null;

  const existing = failedWords[key];
  if (isCorrect && existing) {
    const updated: FailedWordStat = {
      ...existing,
      consecutiveCorrect: existing.consecutiveCorrect + 1,
      sessionCorrect: existing.sessionCorrect + 1,
      gameIndexFailedAt: state.totalAnswers,
    };
    if (updated.sessionCorrect >= MASTERY_THRESHOLD) {
      delete failedWords[key];
      justMastered = state.currentPair.correct;
    } else {
      if (updated.consecutiveCorrect >= GREEN_THRESHOLD) updated.stage = 'green';
      failedWords[key] = updated;
    }
  } else if (!isCorrect) {
    // A miss resets everything: back to the backlog.
    failedWords[key] = {
      pair: state.currentPair,
      stage: 'backlog',
      gameIndexFailedAt: state.totalAnswers,
      consecutiveCorrect: 0,
      sessionCorrect: 0,
    };
  }

  return {
    ...state,
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
    totalAnswers: state.totalAnswers + 1,
    isAnswered: true,
    selectedAnswer: answer,
    failedWords,
    justMastered,
  };
}

export function nextQuestion(state: GameState): GameState {
  let newPair: JLyPair | null = null;
  let isFromBacklog = false;
  const currentKey = pairKey(state.currentPair);
  const answered = state.totalAnswers;

  if ((answered + 1) % BACKLOG_INTERVAL === 0) {
    const ready = Object.entries(state.failedWords).filter(
      ([key, stat]) => key !== currentKey && answered - stat.gameIndexFailedAt >= REAPPEAR_THRESHOLD
    );
    if (ready.length > 0) {
      // Weighted pick: green words come back half as often as backlog ones.
      const totalWeight = ready.reduce((sum, [, s]) => sum + (s.stage === 'green' ? 1 : 2), 0);
      let roll = Math.random() * totalWeight;
      for (const [, stat] of ready) {
        roll -= stat.stage === 'green' ? 1 : 2;
        if (roll < 0) {
          newPair = stat.pair;
          break;
        }
      }
      newPair ??= ready[ready.length - 1][1].pair;
      isFromBacklog = true;
    }
  }

  if (!newPair) {
    // Failed words only come back through the backlog slot above.
    const pool = state.pairs.filter((p) => {
      const key = pairKey(p);
      return key !== currentKey && !state.failedWords[key];
    });
    newPair = randomItem(pool.length > 0 ? pool : state.pairs);
  }

  return {
    ...state,
    currentPair: newPair,
    shuffledOptions: shuffleArray([newPair.correct, newPair.wrong]),
    isAnswered: false,
    selectedAnswer: null,
    isCurrentFromBacklog: isFromBacklog,
    justMastered: null,
  };
}

export function manualRemove(state: GameState, key: string): GameState {
  const failedWords = { ...state.failedWords };
  delete failedWords[key];
  return { ...state, failedWords };
}

export function resetGame(state: GameState): GameState {
  return initializeGameState(state.pairs, state.failedWords);
}
