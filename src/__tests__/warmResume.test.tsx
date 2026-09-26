import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { saveCachedAppData, clearCachedAppData } from '../utils/storage';
import type { AppData } from '../types';
import { DEFAULT_PREFERENCES } from '../types';

const UID = 'user-1';

vi.mock('../utils/remoteStorage', () => ({
  loadRemoteAppData: vi.fn(),
  saveRemoteAppData: vi.fn(async () => true),
}));

vi.mock('../utils/remoteLibrary', () => ({
  loadLibraryOverrides: vi.fn(async () => ({ edits: {}, added: [], removed: [] })),
  applyLibraryOverrides: () => ({ exercises: [], images: {} }),
}));

import { loadRemoteAppData } from '../utils/remoteStorage';

function dataWith(name: string): AppData {
  return {
    exercises: [{ id: 'a', name, bodyPart: 'chest', isCustom: true }],
    workouts: [
      {
        id: 'w1',
        date: '2026-09-20',
        createdAt: '2026-09-20T10:00:00Z',
        name,
        entries: [{ id: 'e1', exerciseId: 'a', sets: [{ setNumber: 1, reps: 5, weightKg: 100 }] }],
      },
    ],
    groups: [],
    preferences: { ...DEFAULT_PREFERENCES },
    deletedExerciseIds: [],
    renamedExerciseIds: [],
    dataVersion: 1,
  };
}

/** Prints whatever the app is holding, so the screen can be read in a test. */
function Probe() {
  const { appData, loading } = useAppContext();
  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="session">{appData.workouts[0]?.name ?? 'none'}</span>
    </div>
  );
}

function renderApp() {
  render(
    <AppProvider uid={UID}>
      <Probe />
    </AppProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  clearCachedAppData(UID);
  vi.clearAllMocks();
});

describe('coming back to the app after it has been dropped', () => {
  it('opens on what the device already has, without waiting for the network', async () => {
    saveCachedAppData(UID, dataWith('Leg day'));
    // A fetch that never settles: the screen must not be waiting on it.
    vi.mocked(loadRemoteAppData).mockReturnValue(new Promise(() => {}));

    renderApp();
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByTestId('loading').textContent).toBe('ready');
    expect(screen.getByTestId('session').textContent).toBe('Leg day');
  });

  it('still holds the screen when the device has nothing to show', async () => {
    vi.mocked(loadRemoteAppData).mockReturnValue(new Promise(() => {}));

    renderApp();
    await act(async () => { await Promise.resolve(); });

    expect(screen.getByTestId('loading').textContent).toBe('loading');
  });

  it('takes what comes back from the fetch once it lands', async () => {
    saveCachedAppData(UID, dataWith('Leg day'));
    vi.mocked(loadRemoteAppData).mockResolvedValue({ data: dataWith('Push day'), existed: true });

    renderApp();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByTestId('session').textContent).toBe('Push day');
  });

  it('keeps a session started before the fetch landed', async () => {
    saveCachedAppData(UID, dataWith('Leg day'));
    let land: (v: { data: AppData; existed: boolean }) => void = () => {};
    vi.mocked(loadRemoteAppData).mockReturnValue(
      new Promise((resolve) => {
        land = resolve;
      }),
    );

    function Logger() {
      const { appData, addWorkout } = useAppContext();
      return (
        <div>
          <span data-testid="count">{appData.workouts.length}</span>
          <button
            type="button"
            onClick={() =>
              addWorkout({
                id: 'w2',
                date: '2026-09-26',
                createdAt: '2026-09-26T10:00:00Z',
                name: 'Logged while away',
                entries: [],
              })
            }
          >
            log it
          </button>
        </div>
      );
    }

    render(
      <AppProvider uid={UID}>
        <Logger />
      </AppProvider>,
    );
    await act(async () => { await Promise.resolve(); });

    // Something logged in the window before the fetch comes back.
    act(() => {
      screen.getByRole('button', { name: 'log it' }).click();
    });
    expect(screen.getByTestId('count').textContent).toBe('2');

    await act(async () => {
      land({ data: dataWith('Push day'), existed: true });
      await Promise.resolve();
      await Promise.resolve();
    });

    // The fetch does not roll that back over the top of it.
    expect(screen.getByTestId('count').textContent).toBe('2');
  });
});
