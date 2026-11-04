'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import GameCard from './components/GameCard';
import ScorePanel from './components/ScorePanel';
import Instructions from './components/Instructions';
import ConfirmDialog from './components/ConfirmDialog';
import { loadPairs } from './utils/pairs';
import { GameState, initializeGameState, selectAnswer, nextQuestion, resetGame, manualRemove, isAnswerCorrect } from './utils/gameLogic';
import { loadProgress, saveCurrentSession, saveFailedWords, saveHighScores, topScores } from './utils/storage';
import { AUTO_ADVANCE_DELAY_MS, AUTO_ADVANCE_DELAY_SECONDS } from './constants';

/** True when a key press should go to a focused control rather than to the game shortcuts. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('button, a, input, select, textarea, [contenteditable="true"]'));
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Scores of finished sessions. The running session is merged in for display only.
  const [savedHighScores, setSavedHighScores] = useState<number[]>([]);
  const [showFailedWordsHistory, setShowFailedWordsHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [keyToRemove, setKeyToRemove] = useState<string | null>(null);
  const [isAutoAdvanceEnabled, setIsAutoAdvanceEnabled] = useState(AUTO_ADVANCE_DELAY_SECONDS > 0);
  const [isCountdownStopped, setIsCountdownStopped] = useState(false);
  const [countdownRemainingMs, setCountdownRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    loadPairs()
      .then((pairs) => {
        const progress = loadProgress(pairs);
        setSavedHighScores(progress.highScores);
        setGameState(initializeGameState(pairs, progress.failedWords));
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  useEffect(() => {
    if (gameState) saveFailedWords(gameState.failedWords);
  }, [gameState?.failedWords]); // eslint-disable-line react-hooks/exhaustive-deps -- only when the record changes

  useEffect(() => {
    if (gameState) saveCurrentSession(gameState.correctAnswers);
  }, [gameState?.correctAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameState?.justMastered) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#3b82f6', '#f59e0b'] });
    }
  }, [gameState?.justMastered]);

  const handleAnswerSelect = useCallback((answer: string) => {
    setIsCountdownStopped(false);
    setGameState((state) => (state ? selectAnswer(state, answer) : state));
  }, []);

  const handleNextQuestion = useCallback(() => {
    // Functional update + the isAnswered guard make a double trigger (click and key) harmless.
    setGameState((state) => (state && state.isAnswered ? nextQuestion(state) : state));
  }, []);

  const handleNewGame = () => {
    if (!gameState) return;
    const scores = topScores([...savedHighScores, gameState.correctAnswers]);
    setSavedHighScores(scores);
    saveHighScores(scores);
    saveCurrentSession(0);
    setGameState(resetGame(gameState));
    setShowConfirmModal(false);
  };

  const hasCorrectAnswer = Boolean(
    gameState?.isAnswered && gameState.selectedAnswer !== null && isAnswerCorrect(gameState.currentPair, gameState.selectedAnswer)
  );
  const canAutoAdvance = AUTO_ADVANCE_DELAY_SECONDS > 0 && isAutoAdvanceEnabled;

  const isCountdownActive = hasCorrectAnswer && canAutoAdvance && !isCountdownStopped;

  useEffect(() => {
    if (!isCountdownActive) return;

    // State is only set from the interval callback (not synchronously in the
    // effect body); until the first tick the render falls back to the full delay.
    const finishAt = Date.now() + AUTO_ADVANCE_DELAY_MS;
    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, finishAt - Date.now());
      setCountdownRemainingMs(remaining);

      if (remaining === 0) {
        window.clearInterval(intervalId);
        handleNextQuestion();
      }
    }, 50);

    return () => {
      window.clearInterval(intervalId);
      setCountdownRemainingMs(null);
    };
  }, [isCountdownActive, handleNextQuestion]);

  useEffect(() => {
    if (!isCountdownActive) return;

    const stopCountdown = () => setIsCountdownStopped(true);
    // Capture phase ensures links and buttons stop the timer before their own action runs.
    document.addEventListener('pointerdown', stopCountdown, true);
    document.addEventListener('keydown', stopCountdown, true);

    return () => {
      document.removeEventListener('pointerdown', stopCountdown, true);
      document.removeEventListener('keydown', stopCountdown, true);
    };
  }, [isCountdownActive]);

  const handleAutoAdvanceChange = (enabled: boolean) => {
    setIsAutoAdvanceEnabled(enabled);
    if (!enabled) setIsCountdownStopped(true);
  };

  const isDialogOpen = showConfirmModal || keyToRemove !== null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState || isDialogOpen || event.altKey || event.ctrlKey || event.metaKey) return;
      const onControl = isInteractiveTarget(event.target);

      switch (event.key) {
        case '1':
        case 'ArrowLeft':
          if (!onControl && !gameState.isAnswered && gameState.shuffledOptions[0]) handleAnswerSelect(gameState.shuffledOptions[0]);
          break;
        case '2':
        case 'ArrowRight':
          if (!onControl && !gameState.isAnswered && gameState.shuffledOptions[1]) handleAnswerSelect(gameState.shuffledOptions[1]);
          break;
        case ' ':
        case 'Enter':
          // On a focused button/link/checkbox, Space and Enter keep their native meaning.
          if (onControl) break;
          event.preventDefault(); // Stop Space from scrolling the page
          if (gameState.isAnswered) handleNextQuestion();
          break;
        case 'n':
        case 'N':
          setShowConfirmModal(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswerSelect, handleNextQuestion, isDialogOpen]);

  if (error) {
    return (
      <div role="alert" className="text-center mt-20 text-error-600">
        <p className="font-bold">A játék betöltése nem sikerült.</p>
        <p className="text-sm mt-2">Ellenőrizd az internetkapcsolatot, majd töltsd újra az oldalt. ({error})</p>
      </div>
    );
  }

  if (!gameState) return <div className="text-center mt-20">Betöltés...</div>;

  const highScores = topScores([...savedHighScores, gameState.correctAnswers]);
  const failedWordsList = Object.entries(gameState.failedWords);
  const statToRemove = keyToRemove ? gameState.failedWords[keyToRemove] : null;
  const remainingMs = isCountdownActive ? (countdownRemainingMs ?? AUTO_ADVANCE_DELAY_MS) : null;
  const countdownProgress = remainingMs === null
    ? 0
    : Math.max(0, Math.min(100, (remainingMs / AUTO_ADVANCE_DELAY_MS) * 100));
  const countdownSeconds = remainingMs === null ? 0 : Math.ceil(remainingMs / 1000);

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
            onSelect={handleAnswerSelect}
            shuffledOptions={gameState.shuffledOptions}
          />

          <div className="flex flex-col items-center mt-4 gap-3">
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={!gameState.isAnswered}
              className={`relative overflow-hidden px-8 py-4 rounded-xl text-lg font-bold transition-all ${gameState.isAnswered ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
            >
              <span className="relative z-10">Következő szó (Enter)</span>
              {remainingMs !== null && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-1 bg-white/80 transition-[width] duration-75 ease-linear"
                  style={{ width: `${countdownProgress}%` }}
                />
              )}
            </button>
            {remainingMs !== null && (
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
            <button
              type="button"
              onClick={() => setShowFailedWordsHistory(!showFailedWordsHistory)}
              aria-expanded={showFailedWordsHistory}
              className="text-sm text-primary-600 underline"
            >
              {showFailedWordsHistory ? 'Elrejtés' : 'Korábban elhibázott szavak listája'}
            </button>

            {showFailedWordsHistory && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border flex flex-wrap gap-2">
                {failedWordsList.length === 0 && <p className="text-sm text-gray-500 italic">Nincs elhibázott szó.</p>}
                {failedWordsList.map(([key, stat]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setKeyToRemove(key)}
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

      <ConfirmDialog
        open={keyToRemove !== null}
        title={
          <>
            <span className={statToRemove?.stage === 'green' ? 'text-green-600' : 'text-red-500'}>{statToRemove?.pair.correct}</span> szó eltávolítása
          </>
        }
        confirmLabel="Eltávolítás"
        confirmClassName="bg-red-500 text-white hover:bg-red-600"
        onCancel={() => setKeyToRemove(null)}
        onConfirm={() => {
          if (keyToRemove) setGameState(manualRemove(gameState, keyToRemove));
          setKeyToRemove(null);
        }}
      >
        <p className="font-medium">Biztosan jól megtanultad ezt a szót? Eltávolítható a listáról?</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={showConfirmModal}
        title="Új játék?"
        confirmLabel="Új játék"
        confirmClassName="bg-primary-600 text-white hover:bg-primary-700"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleNewGame}
      >
        <p>A jelenlegi kör véget ér, a pontszámod bekerül a toplistába. Kezdhetjük?</p>
      </ConfirmDialog>
    </>
  );
}
