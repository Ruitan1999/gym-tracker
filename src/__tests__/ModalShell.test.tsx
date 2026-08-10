import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ModalShell from '../components/shared/ModalShell';

/** Stands in for the browser's visualViewport, which jsdom doesn't implement. */
function stubVisualViewport(initial: { offsetTop: number; height: number }) {
  const listeners = new Map<string, Set<() => void>>();
  const vv = {
    ...initial,
    addEventListener(type: string, fn: () => void) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    },
    removeEventListener(type: string, fn: () => void) {
      listeners.get(type)?.delete(fn);
    },
  };

  Object.defineProperty(window, 'visualViewport', {
    value: vv,
    configurable: true,
    writable: true,
  });

  return {
    /** Mimics the keyboard opening: the visible slice shrinks. */
    resize(next: { offsetTop: number; height: number }) {
      Object.assign(vv, next);
      act(() => {
        listeners.get('resize')?.forEach((fn) => fn());
      });
    },
    listenerCount() {
      return [...listeners.values()].reduce((n, set) => n + set.size, 0);
    },
  };
}

function backdrop() {
  return screen.getByRole('dialog').parentElement!.parentElement!;
}

afterEach(() => {
  // @ts-expect-error - putting jsdom back the way we found it
  delete window.visualViewport;
});

describe('ModalShell', () => {
  it('spans the full screen when there is no visualViewport to measure', () => {
    render(<ModalShell label="Rename">body</ModalShell>);
    expect(backdrop().style.top).toBe('0px');
    expect(backdrop().style.height).toBe('100%');
  });

  it('confines itself to the visible slice so the keyboard cannot cover it', () => {
    const vv = stubVisualViewport({ offsetTop: 0, height: 800 });
    render(<ModalShell label="Rename">body</ModalShell>);
    expect(backdrop().style.height).toBe('800px');

    vv.resize({ offsetTop: 0, height: 340 });
    expect(backdrop().style.height).toBe('340px');
  });

  it('follows the visual viewport when it pans within the layout viewport', () => {
    const vv = stubVisualViewport({ offsetTop: 0, height: 800 });
    render(<ModalShell label="Rename">body</ModalShell>);

    vv.resize({ offsetTop: 120, height: 340 });
    expect(backdrop().style.top).toBe('120px');
    expect(backdrop().style.height).toBe('340px');
  });

  it('drops its viewport listeners when it closes', () => {
    const vv = stubVisualViewport({ offsetTop: 0, height: 800 });
    const { unmount } = render(<ModalShell label="Rename">body</ModalShell>);
    expect(vv.listenerCount()).toBe(2);

    unmount();
    expect(vv.listenerCount()).toBe(0);
  });

  it('dismisses on a backdrop tap but not on a tap inside the dialog', () => {
    const onDismiss = vi.fn();
    render(
      <ModalShell onDismiss={onDismiss} label="Rename">
        body
      </ModalShell>,
    );

    screen.getByRole('dialog').click();
    expect(onDismiss).not.toHaveBeenCalled();

    backdrop().click();
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
