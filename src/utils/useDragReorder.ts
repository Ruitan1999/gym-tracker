import { useCallback, useLayoutEffect, useRef, useState } from 'react';

interface UseDragReorderArgs<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (next: T[]) => void;
  /**
   * Runs before the card is measured, so a consumer can shrink the list into
   * something draggable. Must apply synchronously (flushSync) to be seen.
   */
  onBeforeDrag?: (id: string) => void;
  onAfterDrag?: () => void;
}

interface DragState {
  id: string;
  grabOffset: number;
  pointerY: number;
}

const SETTLE_TRANSITION = 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)';
const HOLD_MS = 350;
const SLOP = 8;

function currentTranslateY(el: HTMLElement): number {
  return parseFloat(el.style.transform.replace(/[^-\d.]/g, '')) || 0;
}

// Pins the dragged element under the pointer, given whatever layout position
// it currently occupies. Safe to call after a reorder has moved it in the DOM.
function pinToPointer(el: HTMLElement, state: DragState) {
  const rect = el.getBoundingClientRect();
  const baseTop = rect.top - currentTranslateY(el);
  el.style.transition = 'none';
  el.style.transform = `translateY(${state.pointerY - state.grabOffset - baseTop}px)`;
}

export function useDragReorder<T>({
  items,
  getId,
  onReorder,
  onBeforeDrag,
  onAfterDrag,
}: UseDragReorderArgs<T>) {
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const refCallbacks = useRef(new Map<string, (el: HTMLElement | null) => void>());
  // Layout-relative offsets, not viewport rects: scrolling must not read as movement.
  const prevTops = useRef(new Map<string, number>());
  const prevOrder = useRef<string[]>([]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onBeforeDragRef = useRef(onBeforeDrag);
  onBeforeDragRef.current = onBeforeDrag;
  const onAfterDragRef = useRef(onAfterDrag);
  onAfterDragRef.current = onAfterDrag;
  const dragStateRef = useRef<DragState | null>(null);
  const cleanupRef = useRef<() => void>(() => {});
  const longPressFiredRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const registerItem = useCallback((id: string) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (el: HTMLElement | null) => {
        if (el) itemRefs.current.set(id, el);
        else itemRefs.current.delete(id);
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }, []);

  // FLIP: when a reorder settles items into new positions, animate the
  // non-dragged ones from their previous spot into the new one. Only a genuine
  // order change animates — expanding a card or re-rendering for unrelated
  // state must leave the list alone.
  useLayoutEffect(() => {
    const ids = items.map(getId);
    const next = new Map<string, number>();
    items.forEach((item) => {
      const el = itemRefs.current.get(getId(item));
      if (el) next.set(getId(item), el.offsetTop);
    });

    const orderChanged =
      ids.length !== prevOrder.current.length ||
      ids.some((id, i) => prevOrder.current[i] !== id);

    if (orderChanged) {
      items.forEach((item) => {
        const id = getId(item);
        const el = itemRefs.current.get(id);
        if (!el) return;
        const dragState = dragStateRef.current;
        if (dragState && id === dragState.id) {
          // A reorder just relocated the dragged card in the DOM; re-pin it so it
          // stays under the finger instead of snapping for a frame.
          pinToPointer(el, dragState);
          return;
        }
        const prev = prevTops.current.get(id);
        const now = next.get(id);
        if (prev === undefined || now === undefined) return;
        const deltaY = prev - now;
        if (Math.abs(deltaY) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translateY(${deltaY}px)`;
          void el.offsetHeight;
          requestAnimationFrame(() => {
            el.style.transition = SETTLE_TRANSITION;
            el.style.transform = '';
          });
        }
      });
    }
    prevTops.current = next;
    prevOrder.current = ids;
  });

  const finishDrag = useCallback(() => {
    const state = dragStateRef.current;
    if (state) {
      const el = itemRefs.current.get(state.id);
      if (el) {
        el.style.transition = 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 220ms ease';
        el.style.transform = '';
        el.style.boxShadow = '';
        el.style.zIndex = '';
        el.style.position = '';
      }
    }
    document.body.classList.remove('dragging-active');
    const wasDragging = dragStateRef.current !== null;
    dragStateRef.current = null;
    setDraggingId(null);
    cleanupRef.current();
    cleanupRef.current = () => {};
    if (wasDragging) onAfterDragRef.current?.();
  }, []);

  const reorderTo = useCallback(
    (id: string, newIndex: number) => {
      const order = itemsRef.current;
      const idx = order.findIndex((it) => getId(it) === id);
      if (idx === -1 || newIndex < 0 || newIndex >= order.length || newIndex === idx) return;
      const next = order.slice();
      const [moved] = next.splice(idx, 1);
      next.splice(newIndex, 0, moved);
      onReorderRef.current(next);
    },
    [getId],
  );

  const beginDrag = useCallback(
    (id: string, clientY: number, pointerId: number) => {
      const el = itemRefs.current.get(id);
      if (!el) return;
      try {
        el.setPointerCapture(pointerId);
      } catch {
        // ignore — not all pointer types support capture
      }

      onBeforeDragRef.current?.(id);

      const rect = el.getBoundingClientRect();
      // Folding the card can leave the grab point past its new bottom edge —
      // hold it by the middle rather than flying it above the finger.
      const rawOffset = clientY - rect.top;
      const grabOffset = rawOffset > rect.height ? rect.height / 2 : Math.max(0, rawOffset);
      dragStateRef.current = { id, grabOffset, pointerY: clientY };
      setDraggingId(id);
      document.body.classList.add('dragging-active');
      el.style.position = 'relative';
      el.style.zIndex = '30';
      el.style.boxShadow = '0 14px 30px -10px rgba(0,0,0,0.3)';
      el.style.transition = 'box-shadow 150ms ease';

      const handleMove = (ev: PointerEvent) => {
        const state = dragStateRef.current;
        if (!state) return;
        const draggedEl = itemRefs.current.get(state.id);
        if (!draggedEl) return;

        state.pointerY = ev.clientY;
        const height = draggedEl.getBoundingClientRect().height;
        pinToPointer(draggedEl, state);

        const order = itemsRef.current;
        const draggedIndex = order.findIndex((it) => getId(it) === state.id);
        if (draggedIndex === -1) return;
        const desiredTop = ev.clientY - state.grabOffset;
        const draggedCenter = desiredTop + height / 2;

        const others = order.filter((it) => getId(it) !== state.id);
        let newIndex = 0;
        for (let i = 0; i < others.length; i++) {
          const otherEl = itemRefs.current.get(getId(others[i]));
          if (!otherEl) continue;
          const otherRect = otherEl.getBoundingClientRect();
          const otherCenter = otherRect.top + otherRect.height / 2;
          if (draggedCenter > otherCenter) {
            newIndex = i + 1;
          } else {
            break;
          }
        }
        if (newIndex !== draggedIndex) {
          reorderTo(state.id, newIndex);
        }
      };

      const handleUp = () => finishDrag();
      // A touch gesture commits to scrolling the moment it starts moving, and
      // touch-action set after the fact can't call that back. Cancelling the
      // move at source is the only thing that stops the page sliding away
      // under a card that's being dragged.
      const blockScroll = (ev: TouchEvent) => ev.preventDefault();

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
      window.addEventListener('touchmove', blockScroll, { passive: false });
      cleanupRef.current = () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
        window.removeEventListener('touchmove', blockScroll);
      };
    },
    [finishDrag, reorderTo, getId],
  );

  // Press and hold anywhere on a card to pick it up, so reordering doesn't
  // depend on hitting the grip — which an expanded card scrolls away from.
  const handleLongPressDown = useCallback(
    (id: string) => (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (!itemRefs.current.has(id)) return;

      const startY = e.clientY;
      const startX = e.clientX;
      const { pointerId } = e;
      longPressFiredRef.current = false;

      const cancel = () => {
        window.clearTimeout(timer);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', cancel);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('scroll', cancel, true);
      };
      // Any real movement before the hold completes is a scroll or a swipe.
      const onMove = (ev: PointerEvent) => {
        if (Math.abs(ev.clientY - startY) > SLOP || Math.abs(ev.clientX - startX) > SLOP) cancel();
      };
      const timer = window.setTimeout(() => {
        cancel();
        longPressFiredRef.current = true;
        navigator.vibrate?.(10);
        beginDrag(id, startY, pointerId);
      }, HOLD_MS);

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', cancel);
      window.addEventListener('pointercancel', cancel);
      window.addEventListener('scroll', cancel, true);
    },
    [beginDrag],
  );

  // The press that started a drag must not also read as a tap on whatever sits
  // under the finger — a collapse toggle, a menu, a rep chip.
  const handleLongPressClickCapture = useCallback((e: React.MouseEvent) => {
    if (!longPressFiredRef.current) return;
    longPressFiredRef.current = false;
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleKeyDown = useCallback(
    (id: string) => (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      const order = itemsRef.current;
      const idx = order.findIndex((it) => getId(it) === id);
      if (idx === -1) return;
      reorderTo(id, e.key === 'ArrowUp' ? idx - 1 : idx + 1);
    },
    [getId, reorderTo],
  );

  return {
    registerItem,
    handleLongPressDown,
    handleLongPressClickCapture,
    handleKeyDown,
    draggingId,
  };
}
