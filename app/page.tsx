'use client';

import { useState, useEffect, useCallback } from 'react';
import GameCard from './components/GameCard';
import ScorePanel from './components/ScorePanel';
import Instructions from './components/Instructions';
import { JLyPair, loadPairs, shuffleArray } from './utils/pairs';
import { GameState, initializeGameState, selectAnswer, nextQuestion, resetGame, FailedWordStat } from './utils/gameLogic';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [highScores, setHighScores] = useState<number[]>([]);
  const [showFailedWordsHistory, setShowFailedWordsHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const savedScores = JSON.parse(localStorage.getItem('j_ly_high_scores') || '[]');
    setHighScores(savedScores);

    const savedFailedWordsStr = localStorage.getItem('j_ly_failed_words');
    let savedFailedWords: Record<string, FailedWordStat> | undefined;
    if (savedFailedWordsStr) {
       savedFailedWords = JSON.parse(savedFailedWordsStr);
    }

    loadPairs()
      .then((pairs) => {
        if (pairs.length === 0) {
          throw new Error('Nem sikerült betölteni a szópárokat.');
        }
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
  }, [gameState?.failedWords]);

  const saveHighScore = useCallback((score: number) => {
     if (score <= 0) return;
     setHighScores(prev => {
        const newScores = [...prev, score].sort((a,b) => b - a).slice(0, 3);
        localStorage.setItem('j_ly_high_scores', JSON.stringify(newScores));
        return newScores;
     });
  }, []);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!gameState || gameState.isAnswered) return;
    setGameState(selectAnswer(gameState, answer));
  }, [gameState]);

  const handleNextQuestion = useCallback(() => {
    if (!gameState) return;
    setGameState(nextQuestion(gameState));
  }, [gameState]);

  const requestNewGame = useCallback(() => {
    if (!gameState) return;
    if (gameState.correctAnswers > 0) {
        setShowConfirmModal(true);
    } else {
        handleNewGame();
    }
  }, [gameState]);

  const handleNewGame = useCallback(() => {
    if (!gameState) return;
    saveHighScore(gameState.correctAnswers);
    setGameState(resetGame(gameState));
    setShowConfirmModal(false);
  }, [gameState, saveHighScore]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Suppress space scrolling
      if (event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
      }

      if (!gameState || showConfirmModal) return;

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
          requestNewGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswerSelect, handleNextQuestion, requestNewGame, showConfirmModal]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Szópárok betöltése...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto mt-8">
        <h2 className="text-2xl font-bold text-error-600 mb-4">Hiba történt</h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Újratöltés
        </button>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  const failedWordsList = Object.values(gameState.failedWords);

  return (
    <>
      <header className="text-center mb-10 relative">
        {highScores.length > 0 && (
           <div className="absolute right-0 top-0 text-sm text-gray-500 hidden sm:block">
               Top Scores: {highScores.join(', ')}
           </div>
        )}
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4 mt-8 sm:mt-0">
          J vagy <span className="text-primary-600">LY</span>?
        </h1>
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
            isPreviouslyFailed={gameState.isCurrentFromBacklog}
          />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNextQuestion}
              disabled={!gameState.isAnswered}
              className={`px-8 py-4 rounded-xl text-lg font-bold transition-all ${gameState.isAnswered ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              aria-label="Következő szó"
            >
              Következő szó
              <span className="text-sm block mt-1 font-normal">(Enter)</span>
            </button>
          </div>

          <div className="mt-8">
            <button 
                onClick={() => setShowFailedWordsHistory(!showFailedWordsHistory)}
                className="text-sm text-primary-600 underline hover:text-primary-800 transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
                {showFailedWordsHistory ? 'Elhibázott szavak elrejtése' : 'Korábban elhibázott szavak mutatása'}
            </button>
            
            {showFailedWordsHistory && failedWordsList.length > 0 && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {failedWordsList.map(stat => {
                            const isCompleted = stat.successCount >= 2;
                            return (
                              <span 
                                  key={stat.pair.correct}
                                  className={`px-2 py-1 text-sm rounded ${isCompleted ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}
                              >
                                  {stat.pair.correct} {isCompleted ? '✓' : ''}
                              </span>
                            );
                        })}
                    </div>
                </div>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <ScorePanel
            correct={gameState.correctAnswers}
            total={gameState.totalAnswers}
            onNewGame={requestNewGame}
            pairCount={gameState.pairCount}
          />
          
          <Instructions />
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Statisztika</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Játékban töltött idő:</span>
                <span className="font-bold text-gray-800">
                  {Math.floor(gameState.totalAnswers * 0.5)} perc
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Gyakorolt szavak:</span>
                <span className="font-bold text-success-600">{gameState.totalAnswers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Új játék kezdése?</h3>
                <p className="text-gray-600 mb-6">A jelenlegi pontszámod mentésre kerül, de a játék nullázódik.</p>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowConfirmModal(false)}
                        className="flex-1 py-3 bg-gray-100 font-bold text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Mégse
                    </button>
                    <button 
                        onClick={handleNewGame}
                        className="flex-1 py-3 bg-error-500 font-bold text-white rounded-xl hover:bg-error-600 transition-colors"
                    >
                        Újraindítás
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
