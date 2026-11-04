'use client';

import { ReactNode, useEffect, useId, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  confirmLabel: string;
  confirmClassName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation built on the native <dialog> element. showModal() gives
 * focus containment, Escape-to-close (the `cancel` event), an inert page
 * behind it and correct screen-reader semantics without custom trap code.
 */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  confirmClassName,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const confirmedRef = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Focus the safe choice so a stray Enter doesn't confirm.
      cancelRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close(); // The browser now restores focus to the button that opened the dialog
      if (confirmedRef.current) {
        // After a confirm (new game, word removed) the opener's job is done.
        // Leaving focus on it would make the next Enter press it again instead
        // of meaning "next word". After a cancel, focus stays put for keyboard users.
        (document.activeElement as HTMLElement | null)?.blur();
      }
      confirmedRef.current = false;
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault(); // Let React state drive closing
        onCancel();
      }}
      onClick={(event) => {
        // A click on the backdrop targets the <dialog> itself.
        if (event.target === ref.current) onCancel();
      }}
      // p-0 + inner padded wrapper: only a click on the backdrop itself targets the
      // <dialog> element; padding on the dialog would count as "backdrop" too.
      // The backdrop colour is set in globals.css (dialog::backdrop).
      className="w-[calc(100%-2rem)] max-w-[332px] rounded-[22px] bg-card p-0 text-ink shadow-[0_20px_50px_rgba(0,0,0,0.25)]"
    >
      <div className="flex flex-col gap-3 p-6">
        <h3 id={titleId} className="text-xl font-bold">
          {title}
        </h3>
        <div className="text-[15px] leading-[1.45] text-ink-muted">{children}</div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-[14px] bg-subtle text-base font-bold text-ink transition-colors hover:bg-line"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={() => {
              confirmedRef.current = true;
              onConfirm();
            }}
            className={`min-h-12 rounded-[14px] text-base font-bold transition-opacity hover:opacity-90 ${confirmClassName}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
