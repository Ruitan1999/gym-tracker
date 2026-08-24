import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { resetPrefetchCache } from '../utils/prefetchImages';

/**
 * The signed-in path, because that is the only one the app mounts: App renders
 * AppProvider with the account's uid, so the loading screen and the pictures
 * behind it are a signed-in story.
 */
const remote = vi.hoisted(() => ({
  data: {
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
  },
}));

vi.mock('../utils/remoteStorage', () => ({
  loadRemoteAppData: vi.fn(async () => ({ data: remote.data, existed: true })),
  saveRemoteAppData: vi.fn(async () => true),
}));

vi.mock('../utils/remoteLibrary', () => ({
  loadLibraryOverrides: vi.fn(async () => ({ edits: {}, added: [], removed: [] })),
}));

const TEMPLATE_PICTURE = '/assets/exercise-images/ex-gv-0001.webp';
const SESSION_PICTURE = '/assets/exercise-images/ex-gv-0002.webp';

/** Every URL the app actually asked the browser to fetch, in order. */
let fetched: string[] = [];

beforeEach(() => {
  localStorage.clear();
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
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(value: string) {
        fetched.push(value);
        // A real picture arrives a moment after it is asked for; what the app
        // does in that gap is the whole question here.
        setTimeout(() => this.onload?.(), 0);
      }
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider uid="u1">{children}</AppProvider>
);

/** Runs the provider's startup — the remote read, the warming, the timers. */
async function startUp(ui: ReactNode = <div />) {
  const view = render(<>{ui}</>, { wrapper });
  await act(async () => {
    await vi.runAllTimersAsync();
  });
  return view;
}

describe("the loading screen and the first screen's pictures", () => {
  it('has them in the browser before it reports the app ready', async () => {
    let atReady: string[] | null = null;
    function Probe() {
      const { loading } = useAppContext();
      if (!loading && atReady === null) atReady = [...fetched];
      return null;
    }

    await startUp(<Probe />);

    // The home screen's template strip, asked for while the loading screen was
    // still up rather than after it went away.
    expect(atReady).not.toBeNull();
    expect(atReady).toContain(TEMPLATE_PICTURE);
  });

  it('does not sit behind a picture that never arrives', async () => {
    // Nothing ever loads: no onload, no onerror, just silence.
    vi.stubGlobal(
      'Image',
      class {
        decoding = '';
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        set src(value: string) {
          fetched.push(value);
        }
      },
    );

    let ready = false;
    function Probe() {
      const { loading } = useAppContext();
      if (!loading) ready = true;
      return null;
    }

    await startUp(<Probe />);

    expect(ready).toBe(true);
  });
});

describe('warming the pictures at startup', () => {
  it('fetches the ones this account uses, without being asked for them', async () => {
    await startUp();

    // The template's exercise and the recent session's, both by convention.
    expect(fetched).toContain(TEMPLATE_PICTURE);
    expect(fetched).toContain(SESSION_PICTURE);
  });

  it('survives the re-render that follows the library loading', async () => {
    // The effect depends on the picture map, which changes identity once the
    // admin layer resolves. That cancels the scheduled fetch and runs again —
    // and used to leave every URL marked as handled but never fetched.
    const { rerender } = render(<div />, { wrapper });
    rerender(<div data-x="1" />);
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(fetched.length).toBeGreaterThan(0);
  });

  it('asks for each picture only once', async () => {
    await startUp();

    expect(new Set(fetched).size).toBe(fetched.length);
  });
});
