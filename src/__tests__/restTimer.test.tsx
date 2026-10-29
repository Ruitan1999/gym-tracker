import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import {
  DEFAULT_REST_SECONDS,
  GO_LINGER_MS,
  REST_STORAGE_KEY,
  useRestTimer,
} from '../utils/useRestTimer';
import RestTimer from '../components/workout/RestTimer';

function Harness() {
  const timer = useRestTimer();
  return (
    <>
      <button onClick={() => timer.start()}>begin</button>
      <RestTimer timer={timer} />
    </>
  );
}

describe('useRestTimer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts at 60s and counts down from the end timestamp', () => {
    const { result } = renderHook(() => useRestTimer());
    expect(result.current.phase).toBe('idle');
    act(() => result.current.start());
    expect(result.current.phase).toBe('running');
    expect(result.current.remaining).toBe(DEFAULT_REST_SECONDS);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(result.current.remaining).toBe(30);
  });

  it('stays right when timers were throttled (clock jumps, no ticks)', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start());
    act(() => {
      vi.setSystemTime(Date.now() + 45_000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(result.current.remaining).toBe(15);
  });

  it('adjusts by 15s and remembers it for the next rest', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start());
    act(() => result.current.adjust(15));
    expect(result.current.remaining).toBe(75);
    expect(localStorage.getItem(REST_STORAGE_KEY)).toBe('75');
    act(() => result.current.skip());
    act(() => result.current.start());
    expect(result.current.remaining).toBe(75);
  });

  it('pause freezes the countdown and resume continues from it', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start());
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    act(() => result.current.togglePause());
    expect(result.current.phase).toBe('paused');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.remaining).toBe(50);
    act(() => result.current.togglePause());
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(result.current.remaining).toBe(45);
  });

  it('skip goes straight back to idle', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start());
    act(() => result.current.skip());
    expect(result.current.phase).toBe('idle');
  });

  it('finishing vibrates, shows go, then hides itself', () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true });
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start(30));
    act(() => {
      vi.advanceTimersByTime(30_500);
    });
    expect(result.current.phase).toBe('go');
    expect(vibrate).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(GO_LINGER_MS + 10);
    });
    expect(result.current.phase).toBe('idle');
    Reflect.deleteProperty(navigator, 'vibrate');
  });

  it('survives blocked storage', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useRestTimer());
    act(() => result.current.start());
    expect(result.current.remaining).toBe(DEFAULT_REST_SECONDS);
    spy.mockRestore();
  });
});

describe('a rest in progress', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is still there after leaving the screen and coming back', () => {
    const first = renderHook(() => useRestTimer());
    act(() => first.result.current.start());
    first.unmount();
    vi.setSystemTime(Date.now() + 20_000);
    const back = renderHook(() => useRestTimer());
    expect(back.result.current.phase).toBe('running');
    expect(back.result.current.remaining).toBe(40);
  });

  it('shows Go and stays until dismissed if it ended while away', () => {
    const first = renderHook(() => useRestTimer());
    act(() => first.result.current.start());
    first.unmount();
    vi.setSystemTime(Date.now() + 61_000);
    const back = renderHook(() => useRestTimer());
    expect(back.result.current.phase).toBe('go');
    act(() => {
      vi.advanceTimersByTime(GO_LINGER_MS * 5);
    });
    expect(back.result.current.phase).toBe('go');
    act(() => back.result.current.skip());
    expect(back.result.current.phase).toBe('idle');
  });
});

describe('RestTimer bar', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing until a rest starts, then shows time and controls', () => {
    render(<Harness />);
    expect(screen.queryByTestId('rest-timer')).toBeNull();
    fireEvent.click(screen.getByText('begin'));
    expect(screen.getByText('1:00')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Extend rest by 15 seconds'));
    expect(screen.getByText('1:15')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Shorten rest by 15 seconds'));
    expect(screen.getByText('1:00')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Pause rest'));
    expect(screen.getByLabelText('Resume rest')).toBeTruthy();
    fireEvent.click(screen.getByText('Skip'));
    // It fades out rather than vanishing.
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByTestId('rest-timer')).toBeNull();
  });
});
