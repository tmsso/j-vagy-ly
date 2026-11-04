const KEYS = [
  { k: '1 / ←', d: 'első opció' },
  { k: '2 / →', d: 'második opció' },
  { k: 'Enter / Szóköz', d: 'következő szó' },
  { k: 'N', d: 'új játék' },
  { k: 'Esc', d: 'ablak bezárása' },
];

/** Keyboard reference, desktop layout only (the page hides it below `lg`). */
export default function Shortcuts({ className = '' }: { className?: string }) {
  return (
    <section aria-labelledby="billentyuk" className={`flex-col gap-3 rounded-[20px] border border-dashed border-line px-5 py-[18px] ${className}`}>
      <h2 id="billentyuk" className="text-[15px] font-bold text-ink">
        Gyorsbillentyűk
      </h2>
      <ul className="flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-ink-muted">
        {KEYS.map(({ k, d }) => (
          <li key={k} className="flex items-center gap-2">
            <kbd className="inline-flex h-[26px] min-w-[26px] items-center justify-center rounded-[7px] border border-b-2 border-line bg-card px-[7px] font-sans text-[13px] font-semibold text-ink">
              {k}
            </kbd>
            {d}
          </li>
        ))}
      </ul>
    </section>
  );
}
