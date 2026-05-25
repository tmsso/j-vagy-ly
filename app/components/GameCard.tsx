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
    
    if (option === correctAnswer || (pair as any).bothCorrect) {
       // if both correct, or this is the correct one, make it green
       if ((pair as any).bothCorrect && selectedAnswer === option) return 'btn-success w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default';
       if (!(pair as any).bothCorrect && option === correctAnswer) return 'btn-success w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default';
       
       if ((pair as any).bothCorrect) return 'btn-success w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default opacity-70';
    }
    
    if (option === selectedAnswer && option !== correctAnswer) {
      return 'btn-error w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default';
    }
    
    return 'btn-secondary w-full min-h-32 py-4 flex flex-col items-center justify-center cursor-default opacity-70';
  };

  // Adaptive font size mapping - use the longest option length to ensure BOTH buttons use the same size
  const maxOptionLength = Math.max(shuffledOptions[0]?.length || 0, shuffledOptions[1]?.length || 0);
  let fontSizeClass = 'text-3xl sm:text-4xl font-bold';
  if (maxOptionLength >= 15) {
    fontSizeClass = 'text-lg sm:text-xl font-bold';
  } else if (maxOptionLength > 12) {
    fontSizeClass = 'text-xl sm:text-2xl font-bold';
  } else if (maxOptionLength > 9) {
    fontSizeClass = 'text-2xl sm:text-3xl font-bold';
  }

  const isBothCorrect = (pair as any).bothCorrect; 
  // If both correct, any selection is considered functionally correct.
  const isGuessCorrect = isBothCorrect || selectedAnswer === correctAnswer;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in relative">
      {/* Hide the warning badge when it's a backlog word being presented, per user request to hide failed words when asking one of those. */}
      {/* Wait, the user said "Hide failed words when asking one of those". I'll remove the badge entirely to fulfill "hide failed words" cleanly from the question screen. */}
      
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Melyik a helyes?</h2>
      <p className="text-gray-600 text-center mb-8 hidden sm:block">Válaszd ki a helyes írásmódot!</p>
      
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
            {isAnswered && (option === correctAnswer || isBothCorrect) && (
              <div className="text-sm mt-2 font-normal">✅ Helyes</div>
            )}
            {isAnswered && option === selectedAnswer && option !== correctAnswer && !isBothCorrect && (
              <div className="text-sm mt-2 font-normal">❌ Hibás</div>
            )}
          </button>
        ))}
      </div>
      
      {isAnswered && (
        <div className={`border rounded-xl p-6 animate-slide-up ${isBothCorrect ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-2xl ${isGuessCorrect ? 'text-success-600' : 'text-error-600'}`}>
              {isGuessCorrect ? '✅' : '❌'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {isBothCorrect ? 'Mindkettő helyes! :)' : (isGuessCorrect ? 'Helyes!' : 'Nem jó.')}
              </h3>
              {!isBothCorrect && (
                  <p className="text-gray-700">
                    A helyes alak: <span className="font-bold text-lg">{correctAnswer}</span>
                  </p>
              )}
              {!isGuessCorrect && !isBothCorrect && (
                <p className="text-gray-600 mt-1">
                  (A másik opció: <span className="italic">{pair.wrong}</span>)
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200 flex gap-4 flex-wrap">
            <a 
              href={`https://www.google.com/search?q=define+${correctAnswer}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
            >
              🔍 Mi az, hogy '{correctAnswer}'?
            </a>
            {isBothCorrect && pair.wrong !== correctAnswer && (
               <a 
               href={`https://www.google.com/search?q=define+${pair.wrong}`} 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
             >
               🔍 Mi az, hogy '{pair.wrong}'?
             </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
