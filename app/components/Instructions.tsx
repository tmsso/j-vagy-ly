'use client';

import { useState } from 'react';
import Collapsible from './Collapsible';
import Icon from './Icon';

export default function Instructions() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Collapsible
      title="Hogyan működik?"
      open={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      summary={
        <p className="text-[15px] leading-normal text-ink-muted">
          Két írásmód közül választasz: az egyik helyes, a másik hibás. A választásod után rögtön látod, hogy eltaláltad-e.
        </p>
      }
    >
      <div className="flex flex-col gap-3.5 pt-3">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] bg-success-50 px-3 text-sm font-semibold text-success-700">
            <Icon name="check" size={16} strokeWidth={3} />
            Helyes: <span className="font-serif text-base text-ink">folyó</span>
          </span>
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] bg-error-50 px-3 text-sm font-semibold text-error-700">
            <Icon name="cross" size={16} strokeWidth={3} />
            Hibás: <span className="font-serif text-base text-ink line-through">fojó</span>
          </span>
        </div>
        {/* Content rule (docs/design/BRIEF.md): there is no pronunciation rule for j/ly; only word families help. */}
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-normal text-ink-muted">
          <li>
            A <strong className="text-ink">j</strong> és az <strong className="text-ink">ly</strong> ma ugyanazt a hangot jelöli. Hogy
            melyiket írjuk, azt a szó eredete és a hagyomány dönti el, nem kiejtési szabály, ezért a szavakat meg kell tanulni.
          </li>
          <li>
            Segít a szócsalád: a tőszó írásmódja a származékokban is megmarad (<em>hely → helyes, helyiség</em>;{' '}
            <em>száj → szájas</em>).
          </li>
          <li>Az elhibázott szavak gyakrabban visszatérnek, amíg meg nem tanulod őket.</li>
        </ul>
      </div>
    </Collapsible>
  );
}
