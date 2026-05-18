'use client';

import { useState, useEffect, useCallback } from 'react';
import GameCard from './components/GameCard';
import ScorePanel from './components/ScorePanel';
import Instructions from './components/Instructions';
import { JLyPair, loadPairs, shuffleArray } from './utils/pairs';
import { GameState, initializeGameState, selectAnswer, nextQuestion, resetGame } from './utils/gameLogic';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPairs()
      .then((pairs) => {
        if (pairs.length === 0) {
          throw new Error('Nem sikerült betölteni a szópárokat.');
        }
        setGameState(initializeGameState(pairs));
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
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

  const handleNewGame = useCallback(() => {
    if (!gameState) return;
    setGameState(resetGame(gameState));
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState) return;

      switch (event.key) {
        case '1':
          if (!gameState.isAnswered && gameState.shuffledOptions[0]) {
            handleAnswerSelect(gameState.shuffledOptions[0]);
          }
          break;
        case '2':
          if (!gameState.isAnswered && gameState.shuffledOptions[1]) {
            handleAnswerSelect(gameState.shuffledOptions[1]);
          }
          break;
        case ' ':
        case 'Spacebar':
          if (gameState.isAnswered) {
            handleNextQuestion();
          }
          break;
        case 'n':
        case 'N':
          handleNewGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleAnswerSelect, handleNextQuestion, handleNewGame]);

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

  return (
    <>
      <header className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
          J vagy <span className="text-primary-600">LY</span>?
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Gyakorold a magyar helyesírást! Válaszd ki a helyes írásmódot a két lehetőség közül.
        </p>
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
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleNextQuestion}
              disabled={!gameState.isAnswered}
              className={`px-8 py-4 rounded-xl text-lg font-bold transition-all ${gameState.isAnswered ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
              aria-label="Következő szó"
            >
              Következő szó
              <span className="text-sm block mt-1 font-normal">(Space)</span>
            </button>
            
            <button
              onClick={handleNewGame}
              className="px-8 py-4 rounded-xl text-lg font-bold btn-secondary"
              aria-label="Új játék kezdése"
            >
              Új játék
              <span className="text-sm block mt-1 font-normal">(N)</span>
            </button>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <ScorePanel
            correct={gameState.correctAnswers}
            total={gameState.totalAnswers}
            onNewGame={handleNewGame}
            pairCount={gameState.pairCount}
          />
          
          <Instructions />
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Statisztika</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Elérhető feladatok:</span>
                <span className="font-bold text-primary-600">{gameState.pairCount.toLocaleString()}</span>
              </div>
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
    </>
  );
}