import { useCallback, useRef } from 'react';

/**
 * How long the page has to hold still before a press on it is trusted.
 *
 * Scrolling fires continuously while it runs, including through momentum, so
 * this is measured from the moment movement stops rather than from when it
 * started. It covers the reflow after a keyboard closes, and is short enough
 * that someone who scrolls to a row and then taps it is never waiting.
 */
const SETTLE_MS = 250;

/** A finger that travelled this far was scrolling, not pressing. */
const MOVE_TOLERANCE_PX = 12;

/** When the page last moved under whatever is on top of it. */
let lastMovedAt = 0;

if (typeof window !== 'undefined') {
  const noteMovement = () => {
    lastMovedAt = Date.now();
  };
  // Capture, because the list that moves is an inner scroller and its scroll
  // events do not bubble.
  window.addEventListener('scroll', noteMovement, true);
  // The keyboard opening or closing on Android resizes the visual viewport
  // without scrolling anything, and moves every row on screen when it does.
  window.visualViewport?.addEventListener('resize', noteMovement);
  window.visualViewport?.addEventListener('scroll', noteMovement);
}

/**
 * A press that acts on what the finger went down on.
 *
 * A click is not decided where the finger lands — it is decided where the
 * finger comes up, on whatever happens to be under it by then. Between those
 * two moments the list moves for entirely ordinary reasons: a weight committing
 * and reflowing the row, the keyboard closing, a card scrolling itself, the
 * momentum of a flick still running. With rows as tall as these, a single
 * scroll of travel is a whole set, so the delete that answers a tap can belong
 * to a row nobody pointed at.
 *
 * Capturing the pointer settles that. From the moment the finger goes down,
 * every event for it comes back to this control whatever moves underneath, so
 * the row that was pressed is the row that acts — and it acts on release, so a
 * finger that starts a scroll from here still scrolls rather than deleting.
 *
 * The press also has to have begun on a page that had held still for a beat.
 * Capture cannot help when the row slid under the finger before it landed:
 * that press is honest but aimed at what was there a moment ago, and for
 * something that cannot be taken back, doing nothing is the right answer.
 *
 * Activating from a keyboard sends a click with no pointer event at all, which
 * still counts — that is what `detail === 0` distinguishes.
 */
export function useAimedPress(onPress: () => void) {
  const press = useRef<{ id: number; x: number; y: number } | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLElement>) => {
    if (Date.now() - lastMovedAt <= SETTLE_MS) {
      press.current = null;
      return;
    }
    // Not available in every environment, and the guard below still holds
    // without it — it just loses the protection against the page moving.
    event.currentTarget.setPointerCapture?.(event.pointerId);
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }, []);

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const started = press.current;
      press.current = null;
      if (!started || started.id !== event.pointerId) return;
      const travelled = Math.hypot(event.clientX - started.x, event.clientY - started.y);
      if (travelled > MOVE_TOLERANCE_PX) return;
      onPress();
    },
    [onPress],
  );

  const onPointerCancel = useCallback(() => {
    press.current = null;
  }, []);

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      // The pointer path has already acted by now; this is here for the
      // keyboard, which sends a click and nothing else.
      if (event.detail === 0) onPress();
    },
    [onPress],
  );

  return { onPointerDown, onPointerUp, onPointerCancel, onClick };
}
