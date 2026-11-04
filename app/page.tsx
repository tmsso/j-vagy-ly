'use client';

import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import GameCard from './components/GameCard';
import ScorePanel from './components/ScorePanel';
import Instructions from './components/Instructions';
import ConfirmDialog from './components/ConfirmDialog';
import FailedWords from './components/FailedWords';
import Shortcuts from './components/Shortcuts';
import Icon from './components/Icon';
import { loadPairs } from './utils/pairs';
import { GameState, initializeGameState, selectAnswer, nextQuestion, resetGame, manualRemove, isAnswerCorrect } from './utils/gameLogic';
import { loadProgress, rankScores, saveCurrentSession, saveFailedWords, saveHighScores, topScores } from './utils/storage';
import { AUTO_ADVANCE_DELAY_MS, AUTO_ADVANCE_DELAY_SECONDS } from './constants';

/**
 * True when Space/Enter should keep their native meaning (press the focused,
 * enabled button, follow the link, toggle the checkbox). Only those two keys
 * defer: digits, arrows and N mean nothing to a button, so they always drive
 * the game, even when a mouse click has left focus on some control.
 */
function hasNativeActivation(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const control = target.closest('button, a[href], input, select, textarea, [contenteditable="true"]');
  return control !== null && !(control as HTMLButtonElement).disabled;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Scores of finished sessions. The running session is merged in for display only.
  const [savedHighScores, setSavedHighScores] = useState<number[]>([]);
  const [showFailedWords, setShowFailedWords] = useState(true);
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
      // disableForReducedMotion: skipped entirely when the OS asks for less motion.
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#1E8A63', '#2C4AAE', '#F2B33D'], disableForReducedMotion: true });
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

      switch (event.key) {
        case '1':
        case 'ArrowLeft':
          if (!gameState.isAnswered && gameState.shuffledOptions[0]) handleAnswerSelect(gameState.shuffledOptions[0]);
          break;
        case '2':
        case 'ArrowRight':
          if (!gameState.isAnswered && gameState.shuffledOptions[1]) handleAnswerSelect(gameState.shuffledOptions[1]);
          break;
        case ' ':
        case 'Enter':
          if (hasNativeActivation(event.target)) break;
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
      <>
        <Header />
        <div role="alert" className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-16 text-center">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-error-50 text-error-700">
            <Icon name="offline" size={28} />
          </span>
          <h2 className="text-lg font-bold text-ink">A játék betöltése nem sikerült.</h2>
          <p className="text-[15px] leading-[1.45] text-ink-muted">Ellenőrizd az internetkapcsolatot, majd töltsd újra az oldalt.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-12 rounded-[14px] bg-primary-600 px-6 text-base font-bold text-white hover:bg-primary-600/90"
          >
            Újratöltés
          </button>
          <p className="font-mono text-xs text-ink-muted">({error})</p>
        </div>
      </>
    );
  }

  if (!gameState) {
    return (
      <>
        <Header />
        <div aria-busy="true" className="mx-auto flex w-full max-w-xl flex-col gap-3 px-4 py-5">
          <div className="h-[22px] w-36 self-center rounded-md bg-subtle" />
          <div className="h-24 rounded-[18px] bg-subtle" />
          <div className="h-24 rounded-[18px] bg-subtle" />
          <p className="mt-2 text-center text-[15px] text-ink-muted">Betöltés…</p>
        </div>
      </>
    );
  }

  const ranked = rankScores(savedHighScores, gameState.correctAnswers);
  const statToRemove = keyToRemove ? gameState.failedWords[keyToRemove] : null;
  const remainingMs = isCountdownActive ? (countdownRemainingMs ?? AUTO_ADVANCE_DELAY_MS) : null;
  const countdownProgress = remainingMs === null
    ? 0
    : Math.max(0, Math.min(100, (remainingMs / AUTO_ADVANCE_DELAY_MS) * 100));
  const countdownSeconds = remainingMs === null ? 0 : Math.ceil(remainingMs / 1000);
  // "Stopped" only means something if a countdown was about to run.
  const showStopped = hasCorrectAnswer && canAutoAdvance && isCountdownStopped;

  return (
    <>
      <Header
        correct={gameState.correctAnswers}
        total={gameState.totalAnswers}
        onNewGame={() => setShowConfirmModal(true)}
      />

      {/*
        Layout: up to `xl` everything is one column (game, next, word list,
        results, help). From `xl` (1280 px) it splits into a game column and a
        side column; any narrower and the side-by-side answer buttons get too
        tight for the widest words at desktop size. The two wrapper divs are
        `display: contents` until then, so their children join one flex column
        and `order-*` can interleave them; from `xl` the wrappers become real
        columns and the order resets.
      */}
      <main className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 p-4 lg:gap-5 lg:px-8 lg:pb-10 lg:pt-4 xl:flex-row xl:items-start xl:gap-7">
        <div className="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col xl:gap-5">
          <div className="order-1 xl:order-none">
            <GameCard
              pair={gameState.currentPair}
              selectedAnswer={gameState.selectedAnswer}
              isAnswered={gameState.isAnswered}
              onSelect={handleAnswerSelect}
              shuffledOptions={gameState.shuffledOptions}
            />
          </div>

          <div className="order-2 flex flex-col gap-2.5 xl:order-none lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-5 lg:gap-y-3">
            <button
              type="button"
              onClick={handleNextQuestion}
              disabled={!gameState.isAnswered}
              aria-keyshortcuts="Enter"
              className={`relative inline-flex min-h-14 items-center justify-center gap-3 overflow-hidden rounded-2xl px-5 text-lg font-bold lg:min-w-[280px] ${
                gameState.isAnswered ? 'bg-primary-600 text-white hover:bg-primary-600/90' : 'cursor-not-allowed bg-subtle text-ink-muted'
              }`}
            >
              Következő szó
              <kbd aria-hidden="true" className="hidden h-[26px] items-center rounded-[7px] bg-white/20 px-2 font-sans text-[13px] font-semibold lg:inline-flex">
                Enter
              </kbd>
              {remainingMs !== null && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[5px] bg-white/75 transition-[width] duration-75 ease-linear"
                  style={{ width: `${countdownProgress}%` }}
                />
              )}
            </button>
            {remainingMs !== null && (
              <p className="text-center text-sm text-ink-muted lg:text-left lg:text-[15px]" aria-live="polite">
                Továbblépés <strong className="font-bold tabular-nums text-ink">{countdownSeconds} mp</strong> múlva
                {/* "Tap anywhere" on touch screens, "any key or click" with a mouse. */}
                <span className="[@media(hover:hover)]:hidden"> · koppints bárhova a megállításhoz</span>
                <span className="hidden [@media(hover:hover)]:inline"> · bármely gomb vagy kattintás megállítja</span>
              </p>
            )}
            {showStopped && (
              <p className="text-center text-sm text-ink-muted lg:text-left lg:text-[15px]" aria-live="polite">
                Megállítva. Lépj tovább, amikor készen állsz.
              </p>
            )}
            {AUTO_ADVANCE_DELAY_SECONDS > 0 && (
              <label className="flex min-h-11 cursor-pointer select-none items-center gap-3 px-1 text-[15px] text-ink-muted lg:basis-full lg:px-0">
                {/* A styled checkbox drawn as a switch: the input itself is the track, the span is the knob. */}
                <span className="relative inline-flex flex-none">
                  <input
                    type="checkbox"
                    checked={isAutoAdvanceEnabled}
                    onChange={(event) => handleAutoAdvanceChange(event.target.checked)}
                    className="peer h-[26px] w-11 cursor-pointer appearance-none rounded-[13px] bg-switch-off transition-colors checked:bg-primary-600"
                  />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform peer-checked:translate-x-[18px]"
                  />
                </span>
                Automatikus továbblépés helyes válasz után
              </label>
            )}
          </div>

          <Shortcuts className="order-6 hidden lg:flex xl:order-none" />
        </div>

        <div className="contents xl:flex xl:w-80 xl:flex-none xl:flex-col xl:gap-5">
          <div className="order-4 xl:order-none">
            <ScorePanel correct={gameState.correctAnswers} total={gameState.totalAnswers} ranked={ranked} pairCount={gameState.pairCount} />
          </div>
          <div className="order-3 xl:order-none">
            <FailedWords
              failedWords={gameState.failedWords}
              open={showFailedWords}
              onToggle={() => setShowFailedWords(!showFailedWords)}
              onRemove={setKeyToRemove}
            />
          </div>
          <div className="order-5 xl:order-none">
            <Instructions />
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={keyToRemove !== null}
        title={
          <>
            „<span className="font-serif">{statToRemove?.pair.correct}</span>” eltávolítása
          </>
        }
        confirmLabel="Eltávolítás"
        confirmClassName="bg-error-600 text-on-feedback"
        onCancel={() => setKeyToRemove(null)}
        onConfirm={() => {
          if (keyToRemove) setGameState(manualRemove(gameState, keyToRemove));
          setKeyToRemove(null);
        }}
      >
        <p>Biztosan jól megtanultad ezt a szót? Eltávolítható a listáról?</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={showConfirmModal}
        title="Új játék?"
        confirmLabel="Új játék"
        confirmClassName="bg-primary-600 text-white"
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleNewGame}
      >
        <p>A jelenlegi kör véget ér, a pontszámod bekerül a toplistába. Kezdhetjük?</p>
      </ConfirmDialog>
    </>
  );
}

interface HeaderProps {
  correct?: number;
  total?: number;
  /** Absent while loading or on the error screen. */
  onNewGame?: () => void;
}

/** Wordmark, plus (once the game runs) the phone score pill and the "Új játék" button. */
function Header({ correct = 0, total = 0, onNewGame }: HeaderProps) {
  return (
    <header className="border-b border-line lg:border-b-0">
      <div className="mx-auto flex min-h-16 w-full max-w-[1180px] items-center justify-between gap-3 px-4 py-2.5 lg:px-8 lg:pb-3 lg:pt-7">
        <h1 className="font-serif text-2xl font-bold tracking-[-0.01em] text-ink lg:text-[36px] lg:tracking-[-0.015em]">
          J vagy <span className="text-primary-text">LY</span>?
        </h1>
        {onNewGame && (
          <div className="flex items-center gap-2">
            {/* Single-column layouts only: there the results card sits far below the game. */}
            <p className="flex items-baseline gap-1 rounded-full border border-line bg-card px-3 py-[7px] text-base font-bold tabular-nums text-ink xl:hidden">
              <span aria-hidden="true">
                {correct} <span className="font-medium text-ink-muted">/ {total}</span>
              </span>
              <span className="sr-only">
                {correct} helyes válasz {total} kérdésből
              </span>
            </p>
            {/* The only way to start over on touch devices (keyboard users also have N). */}
            <button
              type="button"
              onClick={onNewGame}
              aria-keyshortcuts="N"
              className="flex min-h-11 items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 text-[15px] font-semibold text-ink hover:border-ink-muted/40 lg:gap-2.5 lg:pl-4 lg:pr-2"
            >
              <Icon name="restart" />
              Új játék
              <kbd
                aria-hidden="true"
                className="hidden h-[26px] min-w-[26px] items-center justify-center rounded-[7px] border border-line bg-subtle px-1.5 font-sans text-[13px] font-semibold text-ink-muted lg:inline-flex"
              >
                N
              </kbd>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
