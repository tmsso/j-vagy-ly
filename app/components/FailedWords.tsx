'use client';

import type { FailedWords as FailedWordsRecord } from '../utils/gameLogic';
import Collapsible from './Collapsible';
import Icon from './Icon';

interface FailedWordsProps {
  failedWords: FailedWordsRecord;
  open: boolean;
  onToggle: () => void;
  onRemove: (key: string) => void;
}

/** "Gyakorolandó szavak": the missed-word backlog as chips; a tap offers removal. */
export default function FailedWords({ failedWords, open, onToggle, onRemove }: FailedWordsProps) {
  const entries = Object.entries(failedWords);

  return (
    <Collapsible
      title="Gyakorolandó szavak"
      open={open}
      onToggle={onToggle}
      badge={
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-subtle px-2 text-sm font-bold text-ink-muted">
          {entries.length}
        </span>
      }
    >
      {entries.length === 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-base font-semibold text-ink">Nincs elhibázott szó.</p>
          <p className="text-sm leading-[1.45] text-ink-muted">
            A rossz válaszaid ide kerülnek, és gyakrabban visszatérnek, amíg meg nem tanulod őket.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <ul className="flex flex-wrap gap-2">
            {entries.map(([key, stat]) => {
              const isGreen = stat.stage === 'green';
              return (
                <li key={key} className="flex">
                  <button
                    type="button"
                    onClick={() => onRemove(key)}
                    aria-label={`${stat.pair.correct}, ${isGreen ? 'majdnem megtanult' : 'gyakorolandó'}. Eltávolítás a listáról`}
                    className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 font-serif text-[17px] font-semibold text-ink ${
                      isGreen ? 'border-success-600 bg-success-50' : 'border-line bg-card hover:border-ink-muted/40'
                    }`}
                  >
                    {isGreen ? (
                      <Icon name="check" size={16} strokeWidth={3} className="text-success-700" />
                    ) : (
                      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-error-600" />
                    )}
                    {stat.pair.correct}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-error-600" />
              gyakorolandó
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="check" size={14} strokeWidth={3} className="text-success-700" />
              majdnem megvan
            </span>
            {/* "Tap" on touch screens, "click" with a mouse. */}
            <span className="[@media(hover:hover)]:hidden">Koppints egy szóra, ha már biztosan tudod.</span>
            <span className="hidden [@media(hover:hover)]:inline">Kattints egy szóra, ha már biztosan tudod.</span>
          </p>
        </div>
      )}
    </Collapsible>
  );
}
