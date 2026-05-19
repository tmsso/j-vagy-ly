'use client';

import { JLyPair, shuffleArray } from './pairs';

// --- Adjustable Constants ---
export const FAILED_WORD_PROBABILITY_MULTIPLIER = 100.0;
export const FAILED_WORD_SUCCESS_MULTIPLIER = 0.5;
export const FAILED_WORD_FAILURE_MULTIPLIER = 2.0;
export const FAILED_WORD_REAPPEAR_THRESHOLD = 5;

export interface FailedWordStat {
  pair: JLyPair;
  failures: number;
  multiplier: number;
  gameIndexFailedAt: number;
  learned: boolean;
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
}

export function initializeGameState(pairs: JLyPair[], savedFailedWords?: Record<string, FailedWordStat>): GameState {
  const pairCount = pairs.length;
  const initialPair = pairs[Math.floor(Math.random() * pairCount)];
  const initialOptions = [initialPair.correct, initialPair.wrong];
  
  return {
    pairs,
    currentPair: initialPair,
    shuffledOptions: shuffleArray(initialOptions),
    correctAnswers: 0,
    totalAnswers: 0,
    isAnswered: false,
    selectedAnswer: null,
    pairCount,
    failedWords: savedFailedWords || {},
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

  if (isCorrect) {
    if (updatedFailedWords[currentCorrectWord]) {
      updatedFailedWords[currentCorrectWord].multiplier *= FAILED_WORD_SUCCESS_MULTIPLIER;
      updatedFailedWords[currentCorrectWord].learned = true;
    }
  } else {
    // Failed
    if (updatedFailedWords[currentCorrectWord]) {
      updatedFailedWords[currentCorrectWord].multiplier *= FAILED_WORD_FAILURE_MULTIPLIER;
      updatedFailedWords[currentCorrectWord].learned = false;
      updatedFailedWords[currentCorrectWord].failures += 1;
      updatedFailedWords[currentCorrectWord].gameIndexFailedAt = state.totalAnswers;
    } else {
      updatedFailedWords[currentCorrectWord] = {
        pair: state.currentPair,
        failures: 1,
        multiplier: FAILED_WORD_PROBABILITY_MULTIPLIER,
        gameIndexFailedAt: state.totalAnswers,
        learned: false
      };
    }
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
  let newPair: JLyPair;

  // Weighted random selection
  const weights: number[] = [];
  let totalWeight = 0;

  for (const pair of state.pairs) {
    const wordKey = pair.correct;
    const failedStat = state.failedWords[wordKey];
    let weight = 1.0;

    if (failedStat && !failedStat.learned) {
      // Reappear from the threshold-th word after failing
      if (state.totalAnswers - failedStat.gameIndexFailedAt >= FAILED_WORD_REAPPEAR_THRESHOLD) {
        weight = failedStat.multiplier;
      } else {
         // Do not reappear earlier
         weight = 0;
      }
    } else if (failedStat && failedStat.learned) {
        // if learned, still keep the weight adjusted but it can reappear
        if (state.totalAnswers - failedStat.gameIndexFailedAt >= FAILED_WORD_REAPPEAR_THRESHOLD) {
            weight = failedStat.multiplier;
        } else {
            weight = 0; // prevent immediate reappearance
        }
    }

    weights.push(weight);
    totalWeight += weight;
  }

  if (totalWeight <= 0) {
     // fallback if everything is weight 0
     newPair = state.pairs[Math.floor(Math.random() * state.pairCount)];
  } else {
    let randomVal = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      randomVal -= weights[i];
      if (randomVal <= 0) {
        selectedIndex = i;
        break;
      }
    }
    newPair = state.pairs[selectedIndex];
  }

  const newOptions = [newPair.correct, newPair.wrong];
  
  return {
    ...state,
    currentPair: newPair,
    shuffledOptions: shuffleArray(newOptions),
    isAnswered: false,
    selectedAnswer: null,
  };
}

export function resetGame(state: GameState): GameState {
  // Keep the failedWords state 
  const newGameState = initializeGameState(state.pairs, state.failedWords);
  return newGameState;
}