'use client';

import { JLyPair, shuffleArray } from './pairs';

export const BACKLOG_INTERVAL = 4; // Backlog word every 4th question
export const REAPPEAR_THRESHOLD = 5; // Minimal cooling threshold
export const GREEN_THRESHOLD = 2; // Correct guesses in a row to turn green
export const MASTERY_THRESHOLD = 4; // Total correct guesses in session to remove

export type FailedWordStage = 'backlog' | 'green' | 'mastered';

export interface FailedWordStat {
  pair: JLyPair;
  stage: FailedWordStage;
  gameIndexFailedAt: number; // For cooling
  consecutiveCorrect: number; // For turning green
  sessionCorrect: number; // For mastery removal
}

export interface GameState {
  pairs: JLyPair[];
  currentPair: JLyPair;
  shuffledOptions: string[];
  correctAnswers: number;
  totalAnswers: number;
  isAnswered: boolean;
  selectedAnswer: string | null;
  pairCount: number;
  failedWords: Record<string, FailedWordStat>;
  isCurrentFromBacklog: boolean;
  justMastered: string | null; // For flare animation trigger
}

export function initializeGameState(pairs: JLyPair[], savedFailedWords?: Record<string, FailedWordStat>): GameState {
  const initialPair = pairs[Math.floor(Math.random() * pairs.length)];
  
  const validFailedWords: Record<string, FailedWordStat> = {};
  if (savedFailedWords) {
    for (const key in savedFailedWords) {
      // Upon new game/session, treat all pre-existing as backlog (but keep stats)
      validFailedWords[key] = {
        ...savedFailedWords[key],
        stage: 'backlog',
        gameIndexFailedAt: 0, // Ready to appear
        consecutiveCorrect: 0
      };
    }
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
    failedWords: validFailedWords,
    isCurrentFromBacklog: false,
    justMastered: null
  };
}

export function selectAnswer(state: GameState, answer: string): GameState {
  if (state.isAnswered) return state;
  
  const isCorrect = answer === state.currentPair.correct;
  const wordKey = state.currentPair.correct;
  const updatedFailedWords = { ...state.failedWords };
  let justMastered: string | null = null;

  if (isCorrect) {
    if (updatedFailedWords[wordKey]) {
      const stat = updatedFailedWords[wordKey];
      stat.consecutiveCorrect += 1;
      stat.sessionCorrect += 1;
      stat.gameIndexFailedAt = state.totalAnswers;

      if (stat.sessionCorrect >= MASTERY_THRESHOLD) {
        delete updatedFailedWords[wordKey];
        justMastered = wordKey;
      } else if (stat.consecutiveCorrect >= GREEN_THRESHOLD) {
        stat.stage = 'green';
      }
    }
  } else {
    // FAILED: No mercy. Back to backlog, reset counters.
    updatedFailedWords[wordKey] = {
      pair: state.currentPair,
      stage: 'backlog',
      gameIndexFailedAt: state.totalAnswers,
      consecutiveCorrect: 0,
      sessionCorrect: 0
    };
  }

  return {
    ...state,
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
    totalAnswers: state.totalAnswers + 1,
    isAnswered: true,
    selectedAnswer: answer,
    failedWords: updatedFailedWords,
    justMastered
  };
}

export function nextQuestion(state: GameState): GameState {
  let newPair: JLyPair | null = null;
  let isFromBacklog = false;
  const currentTotal = state.totalAnswers;

  // 1-in-4 Logic
  if ((currentTotal + 1) % BACKLOG_INTERVAL === 0) {
    const activeStats = Object.values(state.failedWords).filter(s => 
      currentTotal - s.gameIndexFailedAt >= REAPPEAR_THRESHOLD &&
      s.pair.correct !== state.currentPair.correct
    );

    if (activeStats.length > 0) {
      // Weighted selection: "green" words are 50% less likely
      const weightedList: FailedWordStat[] = [];
      activeStats.forEach(s => {
        const weight = s.stage === 'green' ? 1 : 2;
        for(let i=0; i<weight; i++) weightedList.push(s);
      });
      newPair = weightedList[Math.floor(Math.random() * weightedList.length)].pair;
      isFromBacklog = true;
    }
  }

  if (!newPair) {
    const randomPool = state.pairs.filter(p => 
      p.correct !== state.currentPair.correct && 
      (!state.failedWords[p.correct] || state.failedWords[p.correct].stage === 'mastered')
    );
    newPair = randomPool.length > 0 ? randomPool[Math.floor(Math.random() * randomPool.length)] : state.pairs[Math.floor(Math.random() * state.pairs.length)];
  }

  return {
    ...state,
    currentPair: newPair,
    shuffledOptions: shuffleArray([newPair.correct, newPair.wrong]),
    isAnswered: false,
    selectedAnswer: null,
    isCurrentFromBacklog: isFromBacklog,
    justMastered: null
  };
}

export function manualRemove(state: GameState, word: string): GameState {
  const updated = { ...state.failedWords };
  delete updated[word];
  return { ...state, failedWords: updated };
}

export function resetGame(state: GameState): GameState {
  return initializeGameState(state.pairs, state.failedWords);
}
