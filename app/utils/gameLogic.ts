'use client';

import { JLyPair, shuffleArray } from './pairs';

export interface GameState {
  pairs: JLyPair[];
  currentPair: JLyPair;
  shuffledOptions: string[];
  correctAnswers: number;
  totalAnswers: number;
  isAnswered: boolean;
  selectedAnswer: string | null;
  pairCount: number;
}

export function initializeGameState(pairs: JLyPair[]): GameState {
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
  };
}

export function selectAnswer(state: GameState, answer: string): GameState {
  if (state.isAnswered) {
    return state;
  }
  
  const isCorrect = answer === state.currentPair.correct;
  const newCorrectAnswers = state.correctAnswers + (isCorrect ? 1 : 0);
  
  return {
    ...state,
    correctAnswers: newCorrectAnswers,
    totalAnswers: state.totalAnswers + 1,
    isAnswered: true,
    selectedAnswer: answer,
  };
}

export function nextQuestion(state: GameState): GameState {
  const newPair = state.pairs[Math.floor(Math.random() * state.pairCount)];
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
  const newPair = state.pairs[Math.floor(Math.random() * state.pairCount)];
  const newOptions = [newPair.correct, newPair.wrong];
  
  return {
    ...state,
    currentPair: newPair,
    shuffledOptions: shuffleArray(newOptions),
    correctAnswers: 0,
    totalAnswers: 0,
    isAnswered: false,
    selectedAnswer: null,
  };
}