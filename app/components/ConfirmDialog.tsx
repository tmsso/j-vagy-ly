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
      className="rounded-2xl p-0 max-w-sm w-[calc(100%-2rem)] shadow-2xl bg-white text-gray-800 backdrop:bg-black/50"
    >
      <div className="p-6">
        <h3 id={titleId} className="text-xl font-bold mb-4">
          {title}
        </h3>
        <div className="text-gray-600 mb-6">{children}</div>
        <div className="flex gap-4">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-bold"
          >
            Mégse
          </button>
          <button
            type="button"
            onClick={() => {
              confirmedRef.current = true;
              onConfirm();
            }}
            className={`flex-1 py-3 rounded-xl transition-colors font-bold ${confirmClassName}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
