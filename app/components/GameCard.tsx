'use client';

import { JLyPair } from '../utils/pairs';

interface GameCardProps {
  pair: JLyPair;
  selectedAnswer: string | null;
  isAnswered: boolean;
  correctAnswer: string;
  onSelect: (answer: string) => void;
  shuffledOptions: string[];
  isPreviouslyFailed?: boolean;
}

export default function GameCard({
  pair,
  selectedAnswer,
  isAnswered,
  correctAnswer,
  onSelect,
  shuffledOptions,
  isPreviouslyFailed,
}: GameCardProps) {
  const getButtonClass = (option: string) => {
    if (!isAnswered) {
      return 'btn-primary w-full min-h-32 py-4 flex flex-col items-center justify-center';
    }
    
    if (option === correctAnswer) {
      return 'btn-success w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default';
    }
    
    if (option === selectedAnswer && option !== correctAnswer) {
      return 'btn-error w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default';
    }
    
    return 'btn-secondary w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default opacity-70';
  };

  // Adaptive font size mapping - use the longest option length to ensure BOTH buttons use the same size
  const maxOptionLength = Math.max(shuffledOptions[0]?.length || 0, shuffledOptions[1]?.length || 0);
  let fontSizeClass = 'text-3xl sm:text-4xl font-bold';
  if (maxOptionLength > 12) {
    fontSizeClass = 'text-xl sm:text-2xl font-bold';
  } else if (maxOptionLength > 9) {
    fontSizeClass = 'text-2xl sm:text-3xl font-bold';
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in relative">
      {isPreviouslyFailed && (
        <div className="absolute top-0 right-0 m-4 text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-md border border-yellow-200">
          ⚠️ Korábban elhibázott
        </div>
      )}
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
            <span className={fontSizeClass}>{option}</span>
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
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <a 
              href={`https://www.google.com/search?q=define+${correctAnswer}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit"
            >
              🔍 Mit jelent? (Google keresés)
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
