'use client';

import { JLyPair } from '../utils/pairs';
import { isAnswerCorrect } from '../utils/gameLogic';
import { wordSizeStep } from '../utils/display';
import Icon from './Icon';

interface GameCardProps {
  pair: JLyPair;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onSelect: (answer: string) => void;
  shuffledOptions: string[];
}

// Answer-word sizes per wordSizeStep (phone, then desktop from `lg`). Written out
// in full because Tailwind only generates classes it can find as literal strings.
// Phone sizes are the design values from a 390 px wide screen up; on narrower
// phones clamp() scales them with the viewport width (vw) so the widest words
// in the list still fit (checked against all 16k pairs down to 320 px).
const WORD_SIZE = [
  'text-[clamp(32px,11.3vw,44px)] lg:text-[52px]',
  'text-[clamp(24px,8.7vw,34px)] lg:text-[40px]',
  'text-[clamp(22px,7.7vw,30px)] lg:text-[34px]',
  'text-[clamp(20px,7.2vw,28px)] lg:text-[32px]',
] as const;

const OPTION_BASE =
  'relative flex w-full min-h-[112px] flex-col items-center justify-center gap-1.5 rounded-[18px] border-2 border-b-[5px] px-3 py-4 ' +
  'lg:min-h-[168px] lg:gap-2 lg:rounded-[22px] lg:border-b-[6px] lg:px-5 lg:py-6';

function lookupUrl(word: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`define ${word}`)}`;
}

type OptionState = 'open' | 'right' | 'wrong' | 'other';

const OPTION_STYLE: Record<OptionState, string> = {
  open: 'cursor-pointer border-line bg-card text-ink hover:border-ink-muted/40 motion-safe:active:translate-y-px',
  right: 'cursor-default border-success-600 bg-success-50 text-ink',
  wrong: 'cursor-default border-error-600 bg-error-50 text-ink',
  other: 'cursor-default border-line bg-card text-ink-muted',
};

export default function GameCard({ pair, selectedAnswer, isAnswered, onSelect, shuffledOptions }: GameCardProps) {
  const isBothCorrect = Boolean(pair.bothCorrect);
  const isGuessCorrect = selectedAnswer !== null && isAnswerCorrect(pair, selectedAnswer);

  const stateOf = (option: string): OptionState => {
    if (!isAnswered) return 'open';
    if (option === pair.correct || isBothCorrect) return 'right';
    if (option === selectedAnswer) return 'wrong';
    return 'other';
  };

  const sizeClass = WORD_SIZE[wordSizeStep(Math.max(shuffledOptions[0]?.length ?? 0, shuffledOptions[1]?.length ?? 0))];
  const lookupWords = isBothCorrect ? [pair.correct, pair.wrong] : [pair.correct];

  return (
    <section
      aria-labelledby="kerdes"
      className="flex flex-col gap-4 rounded-3xl border border-line bg-card px-4 py-5 shadow-card motion-safe:animate-fade-in lg:gap-6 lg:rounded-[28px] lg:px-9 lg:pb-9 lg:pt-8"
    >
      <div className="flex flex-col gap-1 text-center">
        <h2 id="kerdes" className="text-[17px] font-semibold text-ink-muted lg:text-[22px] lg:font-bold lg:text-ink">
          Melyik a helyes?
        </h2>
        <p className="hidden text-[15px] text-ink-muted lg:block">Válaszd ki a helyes írásmódot!</p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-5">
        {shuffledOptions.map((option, index) => {
          const state = stateOf(option);
          const isPicked = option === selectedAnswer;
          return (
            <button
              key={index}
              type="button"
              onClick={() => !isAnswered && onSelect(option)}
              disabled={isAnswered}
              aria-label={`${index + 1}. választás: ${option}`}
              className={`${OPTION_BASE} ${OPTION_STYLE[state]}`}
            >
              <kbd
                aria-hidden="true"
                className="absolute left-3 top-3 hidden h-7 w-7 items-center justify-center rounded-lg border border-line bg-subtle font-sans text-sm font-semibold text-ink-muted lg:flex"
              >
                {index + 1}
              </kbd>
              <span
                className={`font-serif font-bold leading-[1.15] ${sizeClass} ${
                  state === 'wrong' ? 'line-through decoration-error-600 decoration-[3px] lg:decoration-4' : ''
                }`}
              >
                {option}
              </span>
              {state === 'right' && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-success-700 lg:text-[15px]">
                  <Icon name="check" strokeWidth={2.5} />
                  {isPicked ? 'Helyes · a te válaszod' : 'Helyes'}
                </span>
              )}
              {state === 'wrong' && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-error-700 lg:text-[15px]">
                  <Icon name="cross" strokeWidth={2.5} />
                  Hibás · a te válaszod
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-2xl bg-subtle p-4 motion-safe:animate-slide-up lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-6 lg:gap-y-4 lg:rounded-[18px] lg:px-6 lg:py-5"
        >
          <div className="flex items-start gap-3 lg:flex-[1_1_280px] lg:gap-3.5">
            <span
              aria-hidden="true"
              className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-on-feedback lg:h-10 lg:w-10 ${
                isGuessCorrect ? 'bg-success-600' : 'bg-error-600'
              }`}
            >
              <Icon name={isGuessCorrect ? 'check' : 'cross'} size={20} strokeWidth={3} />
            </span>
            <div className="flex flex-col gap-1 pt-1 lg:pt-0.5">
              <h3 className="text-xl font-bold text-ink lg:text-[22px]">
                {isBothCorrect ? 'Mindkettő helyes! :)' : isGuessCorrect ? 'Helyes!' : 'Nem jó.'}
              </h3>
              {!isBothCorrect && (
                <p className="text-base text-ink-muted">
                  A helyes alak: <strong className="font-serif text-xl text-ink">{pair.correct}</strong>
                </p>
              )}
              {!isGuessCorrect && !isBothCorrect && (
                <p className="text-[15px] text-ink-muted">
                  A másik opció: <span className="font-serif line-through">{pair.wrong}</span>
                </p>
              )}
              {isBothCorrect && (
                <p className="text-[15px] text-ink-muted">Mindkét alak létezik. Nézd meg, mit jelentenek:</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {lookupWords.map((word) => (
              <a
                key={word}
                href={lookupUrl(word)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-3.5 text-[15px] font-semibold text-primary-text hover:border-primary-text/40"
              >
                <Icon name="search" />
                Mi az, hogy „{word}”?
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
