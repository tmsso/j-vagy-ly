'use client';

import { useState, useEffect, useCallback } from 'react';
import GameCard from './components/GameCard';
import ScorePanel from './components/ScorePanel';
import Instructions from './components/Instructions';
import { JLyPair, loadPairs } from './utils/pairs';
import { GameState, initializeGameState, selectAnswer, nextQuestion, resetGame, manualRemove, FailedWordStat } from './utils/gameLogic';
import confetti from 'canvas-confetti';

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<number[]>([]);
  const [showFailedWordsHistory, setShowFailedWordsHistory] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [wordToRemove, setWordToRemove] = useState<string | null>(null);

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

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!gameState || gameState.isAnswered) return;
    setGameState(selectAnswer(gameState, answer));
  }, [gameState]);

  const handleNextQuestion = useCallback(() => {
    if (!gameState) return;
    setGameState(nextQuestion(gameState));
  }, [gameState]);

  const handleManualRemoveConfirm = () => {
    if (wordToRemove && gameState) {
      setGameState(manualRemove(gameState, wordToRemove));
      setWordToRemove(null);
    }
  };

  if (isLoading || !gameState) return <div className="text-center mt-20">Betöltés...</div>;

  const failedWordsList = Object.values(gameState.failedWords);

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
          
          <div className="flex justify-center mt-4">
            <button
              onClick={handleNextQuestion}
              disabled={!gameState.isAnswered}
              className={`px-8 py-4 rounded-xl text-lg font-bold transition-all ${gameState.isAnswered ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
            >
              Következő szó (Enter)
            </button>
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
          <ScorePanel correct={gameState.correctAnswers} total={gameState.totalAnswers} onNewGame={() => setShowConfirmModal(true)} pairCount={gameState.pairCount} />
          <Instructions />
        </div>
      </div>

      {wordToRemove && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold mb-4">Eltávolítás?</h3>
            <p className="text-gray-600 mb-6">Biztosan jól megtanultad a(z) <strong>{wordToRemove}</strong> szót? Eltávolítható a listáról?</p>
            <div className="flex gap-4">
              <button onClick={() => setWordToRemove(null)} className="flex-1 py-2 bg-gray-100 rounded-lg">Mégse</button>
              <button onClick={handleManualRemoveConfirm} className="flex-1 py-2 bg-red-500 text-white rounded-lg">Igen, eltávolítás</button>
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
