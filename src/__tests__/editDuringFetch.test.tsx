import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { loadCachedAppData, saveCachedAppData } from '../utils/storage';
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

const UID = 'user-1';

function data(names: string[]): AppData {
  return {
    exercises: [],
    workouts: names.map((name, i) => ({
      id: `w${i}`,
      date: '2026-09-20',
      createdAt: `2026-09-2${i}T10:00:00Z`,
      name,
      entries: [],
    })),
    groups: [],
    preferences: { ...DEFAULT_PREFERENCES },
    deletedExerciseIds: [],
    renamedExerciseIds: [],
    dataVersion: 1,
  };
}

function Logger() {
  const { appData, addWorkout } = useAppContext();
  return (
    <div>
      <span data-testid="names">{appData.workouts.map((w) => w.name).join(',')}</span>
      {['First', 'Second'].map((name) => (
        <button
          key={name}
          type="button"
          onClick={() =>
            addWorkout({ id: name, date: '2026-09-26', createdAt: '2026-09-26T10:00:00Z', name, entries: [] })
          }
        >
          {name}
        </button>
      ))}
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.mocked(loadRemoteAppData).mockReset();
  vi.mocked(saveRemoteAppData).mockClear();
});

describe('an edit made while the fetch is still in flight', () => {
  it('stays on the device, and reaches the server with the next save', async () => {
    saveCachedAppData(UID, data(['Old']));
    let land!: (v: { data: AppData; existed: boolean }) => void;
    vi.mocked(loadRemoteAppData).mockReturnValue(new Promise((r) => (land = r)));
    render(
      <AppProvider uid={UID}>
        <Logger />
      </AppProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    await act(async () => land({ data: data(['Old']), existed: true }));

    // The device copy must still hold it, or a relaunch now loses it.
    expect(loadCachedAppData(UID)?.workouts.map((w) => w.name)).toContain('First');
    // And it goes up as soon as the fetch has landed, without waiting for
    // another edit.
    expect(vi.mocked(saveRemoteAppData).mock.calls.at(-1)?.[1].workouts.map((w) => w.name)).toContain('First');

    fireEvent.click(screen.getByRole('button', { name: 'Second' }));
    await act(async () => {});
    const saved = vi.mocked(saveRemoteAppData).mock.calls.at(-1)?.[1];
    expect(saved?.workouts.map((w) => w.name)).toEqual(expect.arrayContaining(['First', 'Second']));
  });
});
