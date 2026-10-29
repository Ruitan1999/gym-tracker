import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';
import type { AppData } from '../types';
import { DEFAULT_PREFERENCES } from '../types';

vi.mock('../utils/remoteStorage', () => ({
  loadRemoteAppData: vi.fn(),
  saveRemoteAppData: vi.fn(async () => true),
}));
vi.mock('../utils/remoteLibrary', () => ({
  loadLibraryOverrides: vi.fn(async () => ({ edits: {}, added: [], removed: [] })),
  applyLibraryOverrides: () => ({ exercises: [], images: {} }),
}));

import { loadRemoteAppData, saveRemoteAppData } from '../utils/remoteStorage';

const ACCOUNT: AppData = {
  exercises: [{ id: 'a', name: 'Bench', bodyPart: 'chest', isCustom: true }],
  workouts: [
    {
      id: 'w1',
      date: '2026-09-20',
      createdAt: '2026-09-20T10:00:00Z',
      name: 'From the account',
      entries: [{ id: 'e1', exerciseId: 'a', sets: [{ setNumber: 1, reps: 5, weightKg: 100 }] }],
    },
  ],
  groups: [],
  preferences: { ...DEFAULT_PREFERENCES },
  deletedExerciseIds: [],
  renamedExerciseIds: [],
  dataVersion: 1,
};

function Probe() {
  const { appData, loading, addWorkout } = useAppContext();
  return (
    <div>
      <button
        type="button"
        onClick={() =>
          addWorkout({
            id: 'w2',
            date: '2026-10-28',
            createdAt: '2026-10-28T10:00:00Z',
            name: 'Logged while loading',
            entries: [],
          })
        }
      >
        log
      </button>
      <span data-testid="loading">{loading ? 'loading' : 'ready'}</span>
      <span data-testid="session">{appData.workouts[0]?.name ?? 'none'}</span>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(loadRemoteAppData).mockReset();
  vi.mocked(saveRemoteAppData).mockClear();
});

describe('first launch on a device with nothing saved', () => {
  it("shows the account's data once it arrives, and does not write over it", async () => {
    vi.mocked(loadRemoteAppData).mockResolvedValue({ data: ACCOUNT, existed: true });
    render(
      <AppProvider uid="user-1">
        <Probe />
      </AppProvider>,
    );
    expect(await screen.findByText('From the account')).toBeTruthy();
    expect(saveRemoteAppData).not.toHaveBeenCalled();
  });

  it('keeps a session saved before the fetch landed, rather than dropping it', async () => {
    let land!: (v: { data: AppData; existed: boolean }) => void;
    vi.mocked(loadRemoteAppData).mockReturnValue(new Promise((r) => (land = r)));
    render(
      <AppProvider uid="user-1">
        <Probe />
      </AppProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'log' }));
    await act(async () => land({ data: ACCOUNT, existed: true }));
    expect(screen.getByTestId('session').textContent).toBe('Logged while loading');
  });
});
