'use client';

import { JLyPair } from '../utils/pairs';
import { isAnswerCorrect } from '../utils/gameLogic';

interface GameCardProps {
  pair: JLyPair;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onSelect: (answer: string) => void;
  shuffledOptions: string[];
}

const BASE = 'w-full min-h-32 py-4 flex flex-col items-center justify-center';

function lookupUrl(word: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`define ${word}`)}`;
}

export default function GameCard({ pair, selectedAnswer, isAnswered, onSelect, shuffledOptions }: GameCardProps) {
  const isBothCorrect = Boolean(pair.bothCorrect);
  const isGuessCorrect = selectedAnswer !== null && isAnswerCorrect(pair, selectedAnswer);

  const getButtonClass = (option: string) => {
    if (!isAnswered) return `btn-primary ${BASE}`;
    if (isBothCorrect) {
      return option === selectedAnswer ? `btn-success ${BASE} cursor-default` : `btn-success ${BASE} cursor-default opacity-70`;
    }
    if (option === pair.correct) return `btn-success ${BASE} cursor-default`;
    if (option === selectedAnswer) return `btn-error ${BASE} cursor-default`;
    return `btn-secondary ${BASE} cursor-default opacity-70`;
  };

  // Adaptive font size from the longer option, so both buttons use the same size.
  const maxOptionLength = Math.max(shuffledOptions[0]?.length || 0, shuffledOptions[1]?.length || 0);
  let fontSizeClass = 'text-3xl sm:text-4xl font-bold';
  if (maxOptionLength >= 15) {
    fontSizeClass = 'text-lg sm:text-xl font-bold';
  } else if (maxOptionLength > 12) {
    fontSizeClass = 'text-xl sm:text-2xl font-bold';
  } else if (maxOptionLength > 9) {
    fontSizeClass = 'text-2xl sm:text-3xl font-bold';
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 animate-fade-in relative">
      <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Melyik a helyes?</h2>
      <p className="text-gray-600 text-center mb-8 hidden sm:block">Válaszd ki a helyes írásmódot!</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {shuffledOptions.map((option, index) => (
          <button
            key={index}
            type="button"
            onClick={() => !isAnswered && onSelect(option)}
            className={getButtonClass(option)}
            disabled={isAnswered}
            aria-label={`${index + 1}. választás: ${option}`}
          >
            <span className={fontSizeClass}>{option}</span>
            {isAnswered && (option === pair.correct || isBothCorrect) && (
              <div className="text-sm mt-2 font-normal">✅ Helyes</div>
            )}
            {isAnswered && option === selectedAnswer && !isGuessCorrect && (
              <div className="text-sm mt-2 font-normal">❌ Hibás</div>
            )}
          </button>
        ))}
      </div>

      {isAnswered && (
        <div
          role="status"
          className={`border rounded-xl p-6 animate-slide-up ${isBothCorrect ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-2xl ${isGuessCorrect ? 'text-success-600' : 'text-error-600'}`} aria-hidden="true">
              {isGuessCorrect ? '✅' : '❌'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {isBothCorrect ? 'Mindkettő helyes! :)' : isGuessCorrect ? 'Helyes!' : 'Nem jó.'}
              </h3>
              {!isBothCorrect && (
                <p className="text-gray-700">
                  A helyes alak: <span className="font-bold text-lg">{pair.correct}</span>
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
            {[pair.correct, ...(isBothCorrect ? [pair.wrong] : [])].map((word) => (
              <a
                key={word}
                href={lookupUrl(word)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1 w-fit bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm"
              >
                🔍 Mi az, hogy &apos;{word}&apos;?
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
