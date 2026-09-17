import { useCallback, useRef } from 'react';

/**
 * A press that only counts where it was aimed.
 *
 * A tap is not settled where the finger lands — it is settled where the finger
 * comes up. If the page moves in between, the browser hands the click to
 * whatever is under the finger by then, and the control that was actually
 * pressed never hears about it. The list moves for ordinary reasons mid-session:
 * a card scrolling itself after a set is added, the keyboard opening or closing,
 * a row above folding away. With rows as tall as these, a few hundred pixels is
 * a whole set, so a tap aimed at one row's delete lands on the next one's.
 *
 * For something destructive that is not a near miss — it removes a set nobody
 * pointed at, while the one they did point at stays. So a click that never
 * received the press is dropped: the tap does nothing, and a second one, on a
 * list now holding still, does what was meant.
 *
 * Activating from a keyboard sends a click with no pointer event at all, which
 * still counts — that is what `detail === 0` distinguishes.
 */
export function useAimedPress(onPress: () => void) {
  const pressedHere = useRef(false);

  const onPointerDown = useCallback(() => {
    pressedHere.current = true;
  }, []);

  const onPointerCancel = useCallback(() => {
    pressedHere.current = false;
  }, []);

  const onClick = useCallback(
    (event: React.MouseEvent) => {
      const fromKeyboard = event.detail === 0;
      const aimed = pressedHere.current;
      pressedHere.current = false;
      if (!aimed && !fromKeyboard) return;
      onPress();
    },
    [onPress],
  );

  return { onPointerDown, onPointerCancel, onClick };
}
