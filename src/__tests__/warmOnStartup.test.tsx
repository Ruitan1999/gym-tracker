import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppProvider } from '../context/AppContext';
import { resetPrefetchCache } from '../utils/prefetchImages';

const STORAGE_KEY = 'gym-tracker-data';

/** Every URL the app actually asked the browser to fetch. */
let fetched: string[] = [];

function seed() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      exercises: [],
      groups: [{ id: 'g1', name: 'Push', exerciseIds: ['ex-gv-0001'], createdAt: '2026-01-01T00:00:00Z' }],
      workouts: [
        {
          id: 'w1',
          date: '2026-08-01',
          createdAt: '2026-08-01T10:00:00Z',
          entries: [{ id: 'e1', exerciseId: 'ex-gv-0002', sets: [{ setNumber: 1, reps: 5, weightKg: 60 }] }],
        },
      ],
      dataVersion: 1,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  seed();
  fetched = [];
  // What has been asked for is module-level and outlives a test, so one test
  // would otherwise leave the next with nothing left to fetch.
  resetPrefetchCache();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal('requestIdleCallback', undefined);
  vi.stubGlobal('cancelIdleCallback', undefined);
  vi.stubGlobal(
    'Image',
    class {
      decoding = '';
      set src(value: string) {
        fetched.push(value);
      }
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const wrapper = ({ children }: { children: ReactNode }) => <AppProvider>{children}</AppProvider>;

describe('warming the pictures at startup', () => {
  it('fetches the ones this account uses, without being asked for them', () => {
    render(<div />, { wrapper });
    act(() => {
      vi.runAllTimers();
    });

    // The template's exercise and the recent session's, both by convention.
    expect(fetched).toContain('/assets/exercise-images/ex-gv-0001.webp');
    expect(fetched).toContain('/assets/exercise-images/ex-gv-0002.webp');
  });

  it('survives the re-render that follows the library loading', () => {
    // The effect depends on the picture map, which changes identity once the
    // admin layer resolves. That cancels the scheduled fetch and runs again —
    // and used to leave every URL marked as handled but never fetched.
    const { rerender } = render(<div />, { wrapper });
    rerender(<div data-x="1" />);
    act(() => {
      vi.runAllTimers();
    });

    expect(fetched.length).toBeGreaterThan(0);
  });

  it('asks for each picture only once', () => {
    render(<div />, { wrapper });
    act(() => {
      vi.runAllTimers();
    });

    expect(new Set(fetched).size).toBe(fetched.length);
  });
});
