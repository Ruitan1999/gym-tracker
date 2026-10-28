import { describe, it, expect, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '../utils/useWakeLock';

function mockWakeLock() {
  const sentinels: { release: ReturnType<typeof vi.fn>; fireRelease: () => void }[] = [];
  const request = vi.fn(async () => {
    const listeners: (() => void)[] = [];
    const s = {
      release: vi.fn(async () => {}),
      addEventListener: (_t: string, cb: () => void) => listeners.push(cb),
      fireRelease: () => listeners.forEach((cb) => cb()),
    };
    sentinels.push(s);
    return s;
  });
  Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true });
  return { request, sentinels };
}

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('useWakeLock', () => {
  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
    setVisibility('visible');
  });

  it('acquires while active and releases on unmount', async () => {
    const { request, sentinels } = mockWakeLock();
    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});
    expect(request).toHaveBeenCalledWith('screen');
    unmount();
    expect(sentinels[0].release).toHaveBeenCalled();
  });

  it('does nothing while inactive', async () => {
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock(false));
    await act(async () => {});
    expect(request).not.toHaveBeenCalled();
  });

  it('releases when it turns inactive', async () => {
    const { sentinels } = mockWakeLock();
    const { rerender } = renderHook(({ on }) => useWakeLock(on), { initialProps: { on: true } });
    await act(async () => {});
    rerender({ on: false });
    expect(sentinels[0].release).toHaveBeenCalled();
  });

  it('takes a fresh lock when the page returns after the browser dropped it', async () => {
    const { request, sentinels } = mockWakeLock();
    renderHook(() => useWakeLock(true));
    await act(async () => {});
    // Going hidden makes the browser release the lock on its own.
    await act(async () => {
      setVisibility('hidden');
      sentinels[0].fireRelease();
    });
    expect(request).toHaveBeenCalledTimes(1);
    await act(async () => {
      setVisibility('visible');
    });
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not stack locks if one is still held when the page shows', async () => {
    const { request } = mockWakeLock();
    renderHook(() => useWakeLock(true));
    await act(async () => {});
    await act(async () => {
      setVisibility('visible');
    });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('swallows refusals and missing support', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: vi.fn(async () => {
          throw new Error('NotAllowedError');
        }),
      },
      configurable: true,
    });
    const { unmount } = renderHook(() => useWakeLock(true));
    await act(async () => {});
    unmount();
    Reflect.deleteProperty(navigator, 'wakeLock');
    const second = renderHook(() => useWakeLock(true));
    second.unmount();
  });
});
