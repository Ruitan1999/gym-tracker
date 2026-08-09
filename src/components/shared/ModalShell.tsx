import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ModalShellProps {
  /** Tapping the backdrop dismisses; omit for a dialog that must be answered. */
  onDismiss?: () => void;
  label?: string;
  children: ReactNode;
}

/**
 * The one dialog frame, so every popup sits in the same place.
 *
 * Centred by a scroll container rather than a transform: a dialog taller than
 * the screen scrolls instead of having its head cut off, and nothing has to be
 * re-centred if the viewport changes size underneath it.
 */
export default function ModalShell({ onDismiss, label, children }: ModalShellProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{
        background: 'rgba(5,5,5,0.7)',
        backdropFilter: 'blur(6px)',
        overscrollBehavior: 'contain',
      }}
      onClick={onDismiss}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="w-full max-w-md p-5"
          style={{
            background: 'var(--color-elev)',
            border: '1px solid var(--color-line-2)',
            borderRadius: '2px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
