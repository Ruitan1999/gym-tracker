import { useCallback, useRef } from 'react';

/**
 * How long the page has to hold still before a press on it is trusted.
 *
 * Scrolling fires continuously while it runs, including through momentum, so
 * this is measured from the moment movement stops rather than from when it
 * started. Long enough to cover the reflow after a keyboard closes; short
 * enough that someone who scrolls to a row and then taps it is never waiting.
 */
const SETTLE_MS = 300;

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
 * A press that only counts where it was aimed, on a page that was holding
 * still.
 *
 * Two ways a tap ends up somewhere it was never pointed:
 *
 * A tap is settled where the finger comes up, not where it goes down. If the
 * page moves in between, the browser hands the click to whatever is under the
 * finger by then, and the control that was pressed never hears about it.
 *
 * And if the page moves just before the finger lands — the keyboard closing
 * after a weight is typed, a card scrolling itself, momentum still running —
 * the press and the release both land on the row that slid into place, which
 * looks like a perfectly ordinary tap on a set nobody chose. With rows this
 * tall, one scroll of travel is a whole set.
 *
 * So a press is honoured only when it went down and came up on the same
 * control, and only when nothing had moved for a beat beforehand. A tap that
 * fails either test does nothing at all, and the next one — on a list now
 * holding still — does what was meant. For something that cannot be taken
 * back, doing nothing is the right answer to "we are not sure what you meant".
 *
 * Activating from a keyboard sends a click with no pointer event at all, which
 * still counts — that is what `detail === 0` distinguishes.
 */
export function useAimedPress(onPress: () => void) {
  const trusted = useRef(false);

  const onPointerDown = useCallback(() => {
    trusted.current = Date.now() - lastMovedAt > SETTLE_MS;
  }, []);

  const onPointerCancel = useCallback(() => {
    trusted.current = false;
  }, []);

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      const fromKeyboard = event.detail === 0;
      const aimed = trusted.current;
      trusted.current = false;
      if (!aimed && !fromKeyboard) return;
      onPress();
    },
    [onPress],
  );

  return { onPointerDown, onPointerCancel, onClick };
}
