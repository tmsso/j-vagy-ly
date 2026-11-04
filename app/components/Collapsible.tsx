'use client';

import { ReactNode, useId } from 'react';
import Icon from './Icon';

interface CollapsibleProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  /** Shown next to the title (e.g. a count). */
  badge?: ReactNode;
  /** Always visible, below the header. */
  summary?: ReactNode;
  children: ReactNode;
}

/** A card whose heading is a disclosure button (aria-expanded + aria-controls). */
export default function Collapsible({ title, open, onToggle, badge, summary, children }: CollapsibleProps) {
  const panelId = useId();
  return (
    <section className="flex flex-col gap-1 rounded-[20px] border border-line bg-card px-4 pb-4 pt-1 lg:rounded-[22px] lg:px-5 lg:pb-[18px]">
      <h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-14 w-full items-center gap-2.5 text-left text-[17px] font-bold text-ink"
        >
          <span className="flex-1">{title}</span>
          {badge}
          <Icon
            name="chevron"
            size={20}
            className={`text-ink-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>
      {summary}
      <div id={panelId} hidden={!open}>
        {children}
      </div>
    </section>
  );
}
