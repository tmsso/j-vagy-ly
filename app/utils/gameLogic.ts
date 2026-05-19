'use client';

import { JLyPair, shuffleArray } from './pairs';

export const FAILED_WORD_REAPPEAR_THRESHOLD = 5;

// Lifecycle: 'backlog' (wait 5) -> 'first_reattempt' (wait 5) -> 'second_reattempt' (wait 5) -> 'completed'
export type FailedWordStage = 'backlog' | 'first_reattempt' | 'second_reattempt' | 'completed';

export interface FailedWordStat {
  pair: JLyPair;
  stage: FailedWordStage;
  gameIndexFailedAt: number; // game index of last failure or success to calculate cooling period
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
  isCurrentFromBacklog: boolean; // flag to uniquely identify if the CURRENT word was intentionally pulled from backlog
}

export function initializeGameState(pairs: JLyPair[], savedFailedWords?: Record<string, FailedWordStat>): GameState {
  const pairCount = pairs.length;
  // Initialize with a random word (no backlog on very first load)
  const initialPair = pairs[Math.floor(Math.random() * pairCount)];
  const initialOptions = [initialPair.correct, initialPair.wrong];
  
  // Cleanup incoming loaded states if needed
  const validFailedWords: Record<string, FailedWordStat> = {};
  if (savedFailedWords) {
    for (const key in savedFailedWords) {
        if (!savedFailedWords[key].stage) {
            // legacy migration
            validFailedWords[key] = {
                pair: savedFailedWords[key].pair,
                stage: (savedFailedWords[key] as any).learned ? 'completed' : 'backlog',
                gameIndexFailedAt: savedFailedWords[key].gameIndexFailedAt || 0
            };
        } else {
            validFailedWords[key] = savedFailedWords[key];
        }
    }
  }

  return {
    pairs,
    currentPair: initialPair,
    shuffledOptions: shuffleArray(initialOptions),
    correctAnswers: 0,
    totalAnswers: 0,
    isAnswered: false,
    selectedAnswer: null,
    pairCount,
    failedWords: validFailedWords,
    isCurrentFromBacklog: false,
  };
}

export function selectAnswer(state: GameState, answer: string): GameState {
  if (state.isAnswered) {
    return state;
  }
  
  const isCorrect = answer === state.currentPair.correct;
  const newCorrectAnswers = state.correctAnswers + (isCorrect ? 1 : 0);
  
  const updatedFailedWords = { ...state.failedWords };
  const currentCorrectWord = state.currentPair.correct;
  const existingStat = updatedFailedWords[currentCorrectWord];

  if (isCorrect) {
    if (existingStat) {
      // Progress the lifecycle
      if (existingStat.stage === 'backlog') {
        existingStat.stage = 'first_reattempt';
        existingStat.gameIndexFailedAt = state.totalAnswers;
      } else if (existingStat.stage === 'first_reattempt') {
        existingStat.stage = 'second_reattempt';
        existingStat.gameIndexFailedAt = state.totalAnswers;
      } else if (existingStat.stage === 'second_reattempt') {
        existingStat.stage = 'completed';
        // remains completed, meaning it is removed from active backlog scheduling!
      }
    }
  } else {
    // Failed handling:
    // If it is entirely new OR if it failed in any reattempt stage -> goes to backlog stage.
    updatedFailedWords[currentCorrectWord] = {
      pair: state.currentPair,
      stage: 'backlog', 
      gameIndexFailedAt: state.totalAnswers,
    };
  }

  return {
    ...state,
    correctAnswers: newCorrectAnswers,
    totalAnswers: state.totalAnswers + 1,
    isAnswered: true,
    selectedAnswer: answer,
    failedWords: updatedFailedWords,
  };
}

export function nextQuestion(state: GameState): GameState {
  let newPair: JLyPair | null = null;
  let isBacklog = false;

  const currentTotal = state.totalAnswers;

  // We should pick a backlog word every 5th word (i.e. indices 4, 9, 14...)
  if ((currentTotal + 1) % 5 === 0) {
    // Collect all words that are actively in backlog/reattempt lifecycle and their cooling period is met
    const eligibleBacklogWords = Object.values(state.failedWords).filter(stat => {
        // Skip completed
        if (stat.stage === 'completed') return false;
        // Check cooling period
        if (currentTotal - stat.gameIndexFailedAt < FAILED_WORD_REAPPEAR_THRESHOLD) return false;
        // Don't pick the exact same word as the immediate previous one
        if (stat.pair.correct === state.currentPair.correct) return false;
        return true;
    });

    if (eligibleBacklogWords.length > 0) {
        // Pick the oldest one first (i.e. smallest gameIndexFailedAt)
        eligibleBacklogWords.sort((a, b) => a.gameIndexFailedAt - b.gameIndexFailedAt);
        newPair = eligibleBacklogWords[0].pair;
        isBacklog = true;
    }
  }

  // Fallback if not grabbing from backlog (or backlog was empty/cooling)
  if (!newPair) {
    // Try to pick a pure random word, prioritizing words that are not currently active in backlog
    let randomPool = state.pairs.filter(p => {
        const stat = state.failedWords[p.correct];
        // If it's currently active in the backlog waiting line, exclude it from random standard drops
        // to prevent premature reappearance.
        if (stat && stat.stage !== 'completed') return false; 
        if (p.correct === state.currentPair.correct) return false;
        return true;
    });

    if (randomPool.length === 0) {
        // Fallback: entire dictionary except current word
        randomPool = state.pairs.filter(p => p.correct !== state.currentPair.correct);
    }
    
    newPair = randomPool[Math.floor(Math.random() * randomPool.length)];
  }

  const newOptions = [newPair.correct, newPair.wrong];
  
  return {
    ...state,
    currentPair: newPair,
    shuffledOptions: shuffleArray(newOptions),
    isAnswered: false,
    selectedAnswer: null,
    isCurrentFromBacklog: isBacklog
  };
}

export function resetGame(state: GameState): GameState {
  const newGameState = initializeGameState(state.pairs, state.failedWords);
  return newGameState;
}
