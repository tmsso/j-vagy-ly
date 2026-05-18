'use client';

import { JLyPair } from '../utils/pairs';

interface GameCardProps {
  pair: JLyPair;
  selectedAnswer: string | null;
  isAnswered: boolean;
  correctAnswer: string;
  onSelect: (answer: string) => void;
  shuffledOptions: string[];
}

export default function GameCard({
  pair,
  selectedAnswer,
  isAnswered,
  correctAnswer,
  onSelect,
  shuffledOptions,
}: GameCardProps) {
  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'btn-primary w-full h-32 text-2xl';
    }
    
    if (option === correctAnswer) {
      return 'btn-success w-full h-32 text-2xl cursor-default';
    }
    
    if (option === selectedAnswer && option !== correctAnswer) {
      return 'btn-error w-full h-32 text-2xl cursor-default';
    }
    
    return 'btn-secondary w-full h-32 text-2xl cursor-default opacity-70';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Melyik a helyes?</h2>
      <p className="text-gray-600 text-center mb-8">Válaszd ki a helyes írásmódot!</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {shuffledOptions.map((option, index) => (
          <button
            key={index}
            onClick={() => !isAnswered && onSelect(option)}
            className={getButtonClass(option)}
            disabled={isAnswered}
            aria-label={`Választás: ${option}`}
          >
            <span className="text-3xl font-bold">{option}</span>
            {isAnswered && option === correctAnswer && (
              <div className="text-sm mt-2 font-normal">✅ Helyes</div>
            )}
            {isAnswered && option === selectedAnswer && option !== correctAnswer && (
              <div className="text-sm mt-2 font-normal">❌ Hibás</div>
            )}
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-2xl ${selectedAnswer === correctAnswer ? 'text-success-600' : 'text-error-600'}`}>
              {selectedAnswer === correctAnswer ? '✅' : '❌'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {selectedAnswer === correctAnswer ? 'Helyes!' : 'Nem jó.'}
              </h3>
              <p className="text-gray-700">
                A helyes alak: <span className="font-bold text-lg">{correctAnswer}</span>
              </p>
              {selectedAnswer !== correctAnswer && (
                <p className="text-gray-600 mt-1">
                  (A másik opció: <span className="italic">{pair.wrong}</span>)
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}