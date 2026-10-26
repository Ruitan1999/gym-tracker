import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
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
  // The handler as it is right now, so the effect below can run once without
  // tearing the history entry down and putting it back on every render.
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  /**
   * A back gesture closes the dialog rather than the page under it.
   *
   * Without this the system back walks off the screen while the dialog is
   * still up, and whatever it was waiting for an answer about never gets one.
   * On the prompt that follows a finished session that meant the session was
   * left pending and never saved: the workout was gone, having been swiped
   * away from the question that was about to commit it.
   *
   * An entry of its own is pushed to be popped, the way the exercise sheet
   * does it, so the back lands here instead of on the route.
   */
  useEffect(() => {
    if (!dismissRef.current) return;
    let holdsEntry = true;
    window.history.pushState({ modal: 'dialog' }, '');

    const onPop = () => {
      holdsEntry = false;
      dismissRef.current?.();
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      // Closed by its own buttons: the entry pushed above is still sitting
      // there and has to go, or the next back press only undoes this.
      //
      // Unless the dialog's answer navigated somewhere, in which case that
      // entry is no longer what the page is standing on and going back would
      // undo the navigation rather than the dialog — which is how answering
      // the prompt after a session landed you back on the session you had
      // just finished, clock still running.
      const stillOurs = (window.history.state as { modal?: string } | null)?.modal === 'dialog';
      if (holdsEntry && stillOurs) window.history.back();
    };
  }, []);

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
