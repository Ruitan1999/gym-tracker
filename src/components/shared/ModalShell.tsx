import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface ModalShellProps {
  /** Tapping the backdrop dismisses; omit for a dialog that must be answered. */
  onDismiss?: () => void;
  label?: string;
  children: ReactNode;
}

/**
 * The slice of screen the keyboard isn't covering, or null before we've
 * measured (and in environments without the API, where `fixed` already spans
 * exactly the visible area).
 *
 * The viewport meta asks the keyboard to overlay the page rather than shrink
 * the layout viewport, which keeps the shell from relaying out on every field
 * tap. The cost is that a `fixed` overlay still spans the full screen, so
 * centring in it puts a dialog behind the keyboard. The visual viewport is the
 * only thing that knows where the keyboard actually ends.
 */
function useVisualViewport(): { top: number; height: number } | null {
  const [rect, setRect] = useState<{ top: number; height: number } | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => setRect({ top: vv.offsetTop, height: vv.height });
    sync();
    // resize fires when the keyboard opens or closes; scroll when the visual
    // viewport pans within the layout viewport (pinch-zoom, iOS scroll-into-view).
    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
    };
  }, []);

  return rect;
}

/**
 * The one dialog frame, so every popup sits in the same place.
 *
 * Centred by a scroll container rather than a transform: a dialog taller than
 * the screen scrolls instead of having its head cut off, and nothing has to be
 * re-centred if the viewport changes size underneath it.
 */
export default function ModalShell({ onDismiss, label, children }: ModalShellProps) {
  const viewport = useVisualViewport();

  return createPortal(
    <div
      className="fixed inset-x-0 z-[60] overflow-y-auto"
      style={{
        top: viewport ? viewport.top : 0,
        height: viewport ? viewport.height : '100%',
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
            borderRadius: 'var(--radius)',
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
