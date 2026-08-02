'use client';

import { useState, useEffect, useCallback } from 'react';
import GameCard from './components/GameCard';
import ScorePanel from './components/ScorePanel';
import Instructions from './components/Instructions';
import { JLyPair, loadPairs } from './utils/pairs';
import { GameState, initializeGameState, selectAnswer, nextQuestion, resetGame, manualRemove, FailedWordStat } from './utils/gameLogic';
import { AUTO_ADVANCE_DELAY_MS, AUTO_ADVANCE_DELAY_SECONDS } from './constants';
import confetti from 'canvas-confetti';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<number[]>([]);
  const [showFailedWordsHistory, setShowFailedWordsHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [wordToRemove, setWordToRemove] = useState<string | null>(null);
  const [isAutoAdvanceEnabled, setIsAutoAdvanceEnabled] = useState(AUTO_ADVANCE_DELAY_SECONDS > 0);
  const [isCountdownStopped, setIsCountdownStopped] = useState(false);
  const [countdownRemainingMs, setCountdownRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    const getStoredJson = <T,>(key: string, fallback: T): T => {
      try {
        const storedValue = localStorage.getItem(key);
        return storedValue ? JSON.parse(storedValue) as T : fallback;
      } catch {
        // A previous app version or a manually edited value should not block the game.
        return fallback;
      }
    };

    const storedScores = getStoredJson<unknown>('j_ly_high_scores', []);
    const savedScores = Array.isArray(storedScores)
      ? storedScores.filter((score): score is number => typeof score === 'number')
      : [];
    setHighScores(savedScores);

    const storedFailedWords = getStoredJson<unknown>(
      'j_ly_failed_words',
      undefined
    );
    const savedFailedWords = storedFailedWords && typeof storedFailedWords === 'object' && !Array.isArray(storedFailedWords)
      ? storedFailedWords as Record<string, FailedWordStat>
      : undefined;

    loadPairs()
      .then((pairs) => {
        setGameState(initializeGameState(pairs, savedFailedWords));
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (gameState?.failedWords) {
      localStorage.setItem('j_ly_failed_words', JSON.stringify(gameState.failedWords));
    }
    if (gameState?.justMastered) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b']
      });
    }
  }, [gameState?.failedWords, gameState?.justMastered]);

  useEffect(() => {
    if (gameState && (gameState.totalAnswers > 0 || Object.keys(gameState.failedWords).length > 0)) {
       const currentScore = gameState.correctAnswers;
       setHighScores(prev => {
         const newScores = [...prev, currentScore].sort((a, b) => b - a);
         const uniqueScores = Array.from(new Set(newScores)).slice(0, 3);
         if (JSON.stringify(uniqueScores) !== JSON.stringify(prev)) {
           localStorage.setItem('j_ly_high_scores', JSON.stringify(uniqueScores));
           return uniqueScores;
         }
         return prev;
       });
    }
  }, [gameState?.correctAnswers, gameState?.totalAnswers]);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!gameState || gameState.isAnswered) return;
    setIsCountdownStopped(false);
    setGameState(selectAnswer(gameState, answer));
  }, [gameState]);

  const handleNextQuestion = useCallback(() => {
    if (!gameState) return;
    setCountdownRemainingMs(null);
    setGameState(nextQuestion(gameState));
  }, [gameState]);

  const hasCorrectAnswer = Boolean(
    gameState?.isAnswered &&
    (gameState.currentPair.bothCorrect || gameState.selectedAnswer === gameState.currentPair.correct)
  );
  const canAutoAdvance = AUTO_ADVANCE_DELAY_SECONDS > 0 && isAutoAdvanceEnabled;

  useEffect(() => {
    if (!hasCorrectAnswer || !canAutoAdvance || isCountdownStopped) {
      setCountdownRemainingMs(null);
      return;
    }

    const finishAt = Date.now() + AUTO_ADVANCE_DELAY_MS;
    setCountdownRemainingMs(AUTO_ADVANCE_DELAY_MS);

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, finishAt - Date.now());
      setCountdownRemainingMs(remaining);

      if (remaining === 0) {
        window.clearInterval(intervalId);
        handleNextQuestion();
      }
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [canAutoAdvance, handleNextQuestion, hasCorrectAnswer, isCountdownStopped]);

  useEffect(() => {
    if (!hasCorrectAnswer || !canAutoAdvance || isCountdownStopped) return;

    const stopCountdown = () => setIsCountdownStopped(true);
    // Capture phase ensures links and buttons stop the timer before their own action runs.
    document.addEventListener('pointerdown', stopCountdown, true);
    document.addEventListener('keydown', stopCountdown, true);

    return () => {
      document.removeEventListener('pointerdown', stopCountdown, true);
      document.removeEventListener('keydown', stopCountdown, true);
    };
  }, [canAutoAdvance, hasCorrectAnswer, isCountdownStopped]);

  const handleManualRemoveConfirm = () => {
    if (wordToRemove && gameState) {
      setGameState(manualRemove(gameState, wordToRemove));
      setWordToRemove(null);
    }
  };

  const handleAutoAdvanceChange = (enabled: boolean) => {
    setIsAutoAdvanceEnabled(enabled);
    if (!enabled) setIsCountdownStopped(true);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Suppress space scrolling
      if (event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
      }

      if (!gameState || showConfirmModal || wordToRemove) return;

      switch (event.key) {
        case '1':
        case 'ArrowLeft':
          if (!gameState.isAnswered && gameState.shuffledOptions[0]) {
            handleAnswerSelect(gameState.shuffledOptions[0]);
          }
          break;
        case '2':
        case 'ArrowRight':
          if (!gameState.isAnswered && gameState.shuffledOptions[1]) {
            handleAnswerSelect(gameState.shuffledOptions[1]);
          }
          break;
        case ' ':
        case 'Spacebar':
        case 'Enter':
          if (gameState.isAnswered) {
            handleNextQuestion();
          }
          break;
        case 'n':
        case 'N':
          setShowConfirmModal(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswerSelect, handleNextQuestion, showConfirmModal, wordToRemove]);

  if (error) {
    return <div className="text-center mt-20 text-error-600">A játék betöltése nem sikerült: {error}</div>;
  }

  if (isLoading || !gameState) return <div className="text-center mt-20">Betöltés...</div>;

  const failedWordsList = Object.values(gameState.failedWords);
  const wordToRemoveData = wordToRemove ? gameState.failedWords[wordToRemove] : null;
  const countdownProgress = countdownRemainingMs === null
    ? 0
    : Math.max(0, Math.min(100, (countdownRemainingMs / AUTO_ADVANCE_DELAY_MS) * 100));
  const countdownSeconds = countdownRemainingMs === null ? 0 : Math.ceil(countdownRemainingMs / 1000);

  return (
    <>
      <header className="text-center mb-10 relative">
        <h1 className="text-5xl font-bold text-gray-800 mb-4 mt-8">J vagy <span className="text-primary-600">LY</span>?</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GameCard
            pair={gameState.currentPair}
            selectedAnswer={gameState.selectedAnswer}
            isAnswered={gameState.isAnswered}
            correctAnswer={gameState.currentPair.correct}
            onSelect={handleAnswerSelect}
            shuffledOptions={gameState.shuffledOptions}
          />
          
          <div className="flex flex-col items-center mt-4 gap-3">
            <button
              onClick={handleNextQuestion}
              disabled={!gameState.isAnswered}
              className={`relative overflow-hidden px-8 py-4 rounded-xl text-lg font-bold transition-all ${gameState.isAnswered ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
            >
              <span className="relative z-10">Következő szó (Enter)</span>
              {countdownRemainingMs !== null && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-1 bg-white/80 transition-[width] duration-75 ease-linear"
                  style={{ width: `${countdownProgress}%` }}
                />
              )}
            </button>
            {countdownRemainingMs !== null && (
              <p className="text-sm text-gray-600" aria-live="polite">
                Következő szó {countdownSeconds} mp múlva
              </p>
            )}
            {AUTO_ADVANCE_DELAY_SECONDS > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAutoAdvanceEnabled}
                  onChange={(event) => handleAutoAdvanceChange(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                Automatikus továbblépés helyes válasz után
              </label>
            )}
          </div>

          <div className="mt-8">
            <button onClick={() => setShowFailedWordsHistory(!showFailedWordsHistory)} className="text-sm text-primary-600 underline">
              {showFailedWordsHistory ? 'Elrejtés' : 'Korábban elhibázott szavak listája'}
            </button>
            
            {showFailedWordsHistory && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border flex flex-wrap gap-2">
                {failedWordsList.map(stat => (
                  <button 
                    key={stat.pair.correct}
                    onClick={() => setWordToRemove(stat.pair.correct)}
                    className={`px-2 py-1 text-sm rounded border transition-colors ${stat.stage === 'green' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-50 text-red-700 border-red-100'}`}
                  >
                    {stat.pair.correct} {stat.stage === 'green' ? '✓' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Top 3 Legjobb Pontszám</h3>
            {highScores.length > 0 ? (
              <ol className="space-y-2">
                {highScores.map((score, idx) => (
                  <li key={idx} className="flex justify-between items-center text-lg">
                    <span className="text-gray-500 font-medium">{idx + 1}.</span>
                    <span className="font-bold text-primary-600">{score} pont</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-500 italic">Még nincs rögzített pontszám.</p>
            )}
          </div>
          <ScorePanel correct={gameState.correctAnswers} total={gameState.totalAnswers} onNewGame={() => setShowConfirmModal(true)} pairCount={gameState.pairCount} />
          <Instructions />
        </div>
      </div>

      {wordToRemove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-4">
              <span className={wordToRemoveData?.stage === 'green' ? 'text-green-600' : 'text-red-500'}>
                {wordToRemove}
              </span> szó eltávolítása
            </h3>
            <p className="text-gray-600 mb-6 font-medium">Biztosan jól megtanultad ezt a szót? Eltávolítható a listáról?</p>
            <div className="flex gap-4">
              <button onClick={() => setWordToRemove(null)} className="flex-1 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-bold">Mégse</button>
              <button onClick={handleManualRemoveConfirm} className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-bold">Eltávolítás</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Új játék?</h3>
            <p className="text-gray-600 mb-6">A jelenlegi pontszám elveszik. Kezdhetjük?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2 bg-gray-100 rounded-lg">Mégse</button>
              <button onClick={() => { setGameState(resetGame(gameState)); setShowConfirmModal(false); }} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Új játék</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
