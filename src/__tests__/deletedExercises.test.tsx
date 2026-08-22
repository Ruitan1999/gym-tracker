import { describe, it, expect, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { mergeExerciseLibrary, isShippedExercise } from '../utils/exerciseLibrary';
import { loadAppData } from '../utils/storage';
import { defaultExercises } from '../data/defaultExercises';
import type { Exercise } from '../types';

const KEY = 'gym-tracker-data';
const shipped = defaultExercises[0];

describe('mergeExerciseLibrary with deletions remembered', () => {
  it('leaves out a shipped exercise that was deleted', () => {
    const merged = mergeExerciseLibrary([], [shipped.id]);
    expect(merged.some((e) => e.id === shipped.id)).toBe(false);
    expect(merged.length).toBe(defaultExercises.length - 1);
  });

  it('does not bring it back alongside a stored library either', () => {
    const custom: Exercise = { id: 'c1', name: 'Mine', bodyPart: 'core', isCustom: true };
    const merged = mergeExerciseLibrary([custom], [shipped.id]);
    expect(merged.some((e) => e.id === shipped.id)).toBe(false);
  });

  it('keeps everything else', () => {
    const merged = mergeExerciseLibrary([], [shipped.id]);
    for (const e of defaultExercises.slice(1)) {
      expect(merged.some((x) => x.id === e.id)).toBe(true);
    }
  });

  it('knows which exercises are ours to put back', () => {
    expect(isShippedExercise(shipped.id)).toBe(true);
    expect(isShippedExercise('custom-1')).toBe(false);
  });
});

function Harness({ onReady }: { onReady: (api: ReturnType<typeof useAppContext>) => void }) {
  const api = useAppContext();
  onReady(api);
  return <div>{api.appData.exercises.length}</div>;
}

describe('deleting an exercise', () => {
  beforeEach(() => localStorage.clear());

  it('records a shipped one so it stays gone across a reload', () => {
    let api!: ReturnType<typeof useAppContext>;
    render(
      <AppProvider>
        <Harness onReady={(a) => (api = a)} />
      </AppProvider>,
    );

    act(() => {
      expect(api.deleteExercise(shipped.id)).toBe(true);
    });

    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored.deletedExerciseIds).toContain(shipped.id);

    // What the next launch sees.
    expect(loadAppData().exercises.some((e) => e.id === shipped.id)).toBe(false);
  });

  it('does not bother recording an exercise nobody would put back', () => {
    let api!: ReturnType<typeof useAppContext>;
    render(
      <AppProvider>
        <Harness onReady={(a) => (api = a)} />
      </AppProvider>,
    );

    act(() => {
      api.addExercise({ id: 'c1', name: 'Mine', bodyPart: 'core', isCustom: true });
    });
    act(() => {
      expect(api.deleteExercise('c1')).toBe(true);
    });

    const stored = JSON.parse(localStorage.getItem(KEY)!);
    expect(stored.deletedExerciseIds ?? []).not.toContain('c1');
    expect(loadAppData().exercises.some((e) => e.id === 'c1')).toBe(false);
  });

  it('still refuses to delete one that has been logged against', () => {
    let api!: ReturnType<typeof useAppContext>;
    render(
      <AppProvider>
        <Harness onReady={(a) => (api = a)} />
      </AppProvider>,
    );

    act(() => {
      api.addWorkout({
        id: 'w1',
        date: '2026-08-01',
        createdAt: '2026-08-01T10:00:00.000Z',
        entries: [{ id: 'e1', exerciseId: shipped.id, sets: [{ setNumber: 1, reps: 8, weightKg: 20 }] }],
      });
    });
    act(() => {
      expect(api.deleteExercise(shipped.id)).toBe(false);
    });

    expect(loadAppData().exercises.some((e) => e.id === shipped.id)).toBe(true);
  });
});
