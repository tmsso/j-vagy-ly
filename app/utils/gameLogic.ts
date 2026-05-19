'use client';

import { JLyPair, shuffleArray } from './pairs';

export const FAILED_WORD_REAPPEAR_THRESHOLD = 5; // Words to wait before reattempting a failed word.
export const MAX_FAILED_WORD_RETRIES = 2;       // Max reattempts before word is considered 'completed' in throttling.
export const CORRECT_GUESSES_TO_COMPLETE = 2;   // How many correct guesses are needed for a word to be 'completed'.

// Lifecycle stages for failed words
export type FailedWordStage = 'backlog' | 'first_reattempt' | 'second_reattempt' | 'completed';

export interface FailedWordStat {
  pair: JLyPair;
  stage: FailedWordStage;
  gameIndexFailedAt: number; // The game index when the word last entered a 'failed' state or its stage advanced.
  successCount: number;     // How many times this specific word has been guessed correctly.
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
  failedWords: Record<string, FailedWordStat>; // Key: correct word
  isCurrentFromBacklog: boolean; // Flag to indicate if the current word was chosen from the backlog.
}

export function initializeGameState(pairs: JLyPair[], savedFailedWords?: Record<string, FailedWordStat>): GameState {
  const pairCount = pairs.length;
  const initialPair = pairs[Math.floor(Math.random() * pairCount)];
  const initialOptions = [initialPair.correct, initialPair.wrong];
  
  const initializedFailedWords: Record<string, FailedWordStat> = {};
  if (savedFailedWords) {
    for (const word in savedFailedWords) {
      const stat = savedFailedWords[word];
      // Ensure stage is valid, default to backlog if invalid
      if (!['backlog', 'first_reattempt', 'second_reattempt', 'completed'].includes(stat.stage)) {
        stat.stage = 'backlog';
      }
      initializedFailedWords[word] = stat;
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
    failedWords: initializedFailedWords,
    isCurrentFromBacklog: false,
  };
}

export function recordCorrectWord(state: GameState, word: string): GameState {
  const stat = state.failedWords[word];
  
  if (stat) {
    stat.successCount = (stat.successCount || 0) + 1;
    stat.gameIndexFailedAt = state.totalAnswers; // Reset cooldown timer on success

    if (stat.successCount >= CORRECT_GUESSES_TO_COMPLETE) {
      stat.stage = 'completed';
    } else if (stat.stage === 'backlog') {
      stat.stage = 'first_reattempt';
    } else if (stat.stage === 'first_reattempt') {
      stat.stage = 'second_reattempt';
    }
    // If stage is already 'second_reattempt' and successCount reaches CORRECT_GUESSES_TO_COMPLETE, it becomes 'completed'
    // If stage is 'completed', it remains 'completed'
  }
  // If the word wasn't in failedWords, it means it was either correct or never failed. Nothing to add/modify in failedWords.
  return { ...state, failedWords: { ...state.failedWords } };
}

export function recordFailedWord(state: GameState, word: string, wordIndex: number): GameState {
  const existingStat = state.failedWords[word];
  const updatedFailedWords = { ...state.failedWords };

  if (existingStat) {
    // Existing word failed again
    existingStat.successCount = 0; // Reset success count on new failure
    existingStat.gameIndexFailedAt = wordIndex;
    
    // Reset stage to backlog if it was in any reattempt stage
    if (existingStat.stage !== 'completed') { // Only update if not already completed
        existingStat.stage = 'backlog';
    }
  } else {
    // New word failed
    updatedFailedWords[word] = {
      pair: state.currentPair, // Store the pair for context
      stage: 'backlog',
      gameIndexFailedAt: wordIndex,
      successCount: 0,
    };
  }
  return { ...state, failedWords: updatedFailedWords };
}

export function selectAnswer(state: GameState, answer: string): GameState {
  if (state.isAnswered) {
    return state;
  }
  
  const isCorrect = answer === state.currentPair.correct;
  
  let updatedState: GameState = { 
    ...state,
    selectedAnswer: answer,
    totalAnswers: state.totalAnswers + 1,
    correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
    isAnswered: true
  };

  if (isCorrect) {
    updatedState = recordCorrectWord(updatedState, state.currentPair.correct);
  } else {
    updatedState = recordFailedWord(updatedState, state.currentPair.correct, state.totalAnswers);
  }

  return updatedState;
}

export function nextQuestion(state: GameState): GameState {
  let newPair: JLyPair | null = null;
  let isBacklogPick = false;

  const currentTotal = state.totalAnswers;

  // Collect words that are eligible for reappearance from backlog/reattempt stages
  const eligibleBacklogCandidates = Object.values(state.failedWords).filter(stat =>
    stat.stage !== 'completed' && // Must not be completed
    (currentTotal - stat.gameIndexFailedAt >= FAILED_WORD_REAPPEAR_THRESHOLD) // Must have passed cooling period
  );
  
  // Check if it's time to pick from the backlog (every 5th word as per user request)
  const isFifthWordInSequence = (currentTotal + 1) % 5 === 0;

  if (isFifthWordInSequence && eligibleBacklogCandidates.length > 0) {
    // Pick the one that failed earliest among eligible candidates to ensure variety
    eligibleBacklogCandidates.sort((a, b) => a.gameIndexFailedAt - b.gameIndexFailedAt);
    newPair = eligibleBacklogCandidates[0].pair;
    isBacklogPick = true;
  }

  // If not picking from backlog, pick a random word
  if (!newPair) {
    // Filter out words that are currently in a 'waiting' state (not yet cooled down)
    let randomPool = state.pairs.filter(pair => {
        const stat = state.failedWords[pair.correct];
        // If it's in a stage that requires cooling and hasn't met the threshold, exclude it for standard random picks.
        if (stat && stat.stage !== 'completed' && (currentTotal - stat.gameIndexFailedAt < FAILED_WORD_REAPPEAR_THRESHOLD)) {
            return false;
        }
        // Ensure we don't pick the exact same word immediately again (though shuffleArray helps)
        if (pair.correct === state.currentPair.correct) return false;
        return true;
    });
    
    // If filtering resulted in an empty pool, fallback to non-filtered pairs (except current)
    if (randomPool.length === 0) {
        randomPool = state.pairs.filter(p => p.correct !== state.currentPair.correct);
        if (randomPool.length === 0) { // Absolute fallback if pairs only contains current word
          randomPool = state.pairs;
        }
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
    isCurrentFromBacklog: isBacklogPick,
  };
}

export function resetGame(state: GameState): GameState {
  // Re-initialize, keeping current failedWords state for continuity
  const newGameState = initializeGameState(state.pairs, state.failedWords);
  return newGameState;
}
