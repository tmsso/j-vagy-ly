'use client';

import type { RankedScore } from '../utils/storage';

interface ScorePanelProps {
  correct: number;
  total: number;
  ranked: RankedScore[];
  pairCount: number;
}

/** "Eredmény": this session's numbers plus the Top-3 list. */
export default function ScorePanel({ correct, total, ranked, pairCount }: ScorePanelProps) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <section
      aria-labelledby="eredmeny"
      className="flex flex-col gap-3.5 rounded-[20px] border border-line bg-card px-4 py-[18px] lg:rounded-[22px] lg:px-5 lg:py-[22px]"
    >
      <h2 id="eredmeny" className="text-[17px] font-bold text-ink">
        Eredmény
      </h2>
      <div className="grid grid-cols-3 gap-2 tabular-nums">
        <Stat value={correct} label="helyes" className="text-primary-text" />
        <Stat value={total} label="összes" className="text-ink" />
        <Stat value={`${accuracy}%`} label="pontosság" className="text-success-700" />
      </div>
      <div
        role="progressbar"
        aria-label="Pontosság"
        aria-valuenow={accuracy}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded bg-line"
      >
        <div
          className="h-full rounded bg-success-600 transition-[width] duration-500 ease-out"
          style={{ width: `${accuracy}%` }}
        />
      </div>

      <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
        <h3 className="text-[15px] font-bold text-ink">Legjobb eredmények</h3>
        {ranked.length > 0 ? (
          <ol className="grid grid-cols-3 gap-2">
            {ranked.map((entry, idx) => (
              <li
                key={idx}
                className={`flex flex-col gap-0.5 rounded-xl px-2.5 py-2.5 ${entry.isCurrent ? 'bg-primary-50' : 'bg-subtle'}`}
              >
                <span className="text-xs font-semibold text-ink-muted">{idx + 1}. hely</span>
                {/* "pont" set smaller and kept on one line: the tiles are narrow in the desktop side column. */}
                <span className="whitespace-nowrap text-lg font-bold tabular-nums text-ink">
                  {entry.score} <span className="text-sm font-semibold text-ink-muted">pont</span>
                </span>
                {entry.isCurrent && <span className="text-xs font-semibold text-primary-text">ez a kör</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[15px] text-ink-muted">Még nincs rögzített pontszám.</p>
        )}
      </div>
      <p className="text-[13px] text-ink-muted">{pairCount.toLocaleString('hu-HU')} szópár</p>
    </section>
  );
}

function Stat({ value, label, className }: { value: number | string; label: string; className: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-[28px] font-bold leading-[1.1] lg:text-[30px] ${className}`}>{value}</span>
      <span className="text-[13px] text-ink-muted">{label}</span>
    </div>
  );
}
