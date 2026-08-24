import { describe, it, expect } from 'vitest';
import { usedExerciseIds } from '../utils/warmExerciseImages';

const workout = (id: string, createdAt: string, exerciseIds: string[]) => ({
  id,
  date: createdAt.slice(0, 10),
  createdAt,
  entries: exerciseIds.map((exerciseId, i) => ({
    id: `${id}-${i}`,
    exerciseId,
    sets: [{ setNumber: 1, reps: 5, weightKg: 60 }],
  })),
});

const group = (id: string, exerciseIds: string[]) => ({
  id,
  name: id,
  exerciseIds,
  createdAt: '2026-01-01T00:00:00Z',
});

describe('usedExerciseIds', () => {
  it('takes the exercises in templates and in recent sessions', () => {
    const ids = usedExerciseIds({
      groups: [group('g1', ['a', 'b'])],
      workouts: [workout('w1', '2026-08-01T10:00:00Z', ['c'])],
    });
    expect(new Set(ids)).toEqual(new Set(['a', 'b', 'c']));
  });

  it('puts template exercises first, since those are on the home screen', () => {
    const ids = usedExerciseIds({
      groups: [group('g1', ['a'])],
      workouts: [workout('w1', '2026-08-01T10:00:00Z', ['z'])],
    });
    expect(ids[0]).toBe('a');
  });

  it('names each exercise once however many places it appears', () => {
    const ids = usedExerciseIds({
      groups: [group('g1', ['a', 'a']), group('g2', ['a'])],
      workouts: [workout('w1', '2026-08-01T10:00:00Z', ['a'])],
    });
    expect(ids).toEqual(['a']);
  });

  it('reaches back only so far through the log', () => {
    // Warming a whole training history would be most of the library.
    const workouts = Array.from({ length: 60 }, (_, i) =>
      workout(`w${i}`, `2026-06-${String((i % 28) + 1).padStart(2, '0')}T10:00:00Z`, [`ex-${i}`]),
    );
    const ids = usedExerciseIds({ groups: [], workouts }, 10);
    expect(ids).toHaveLength(10);
  });

  it('reaches back from the most recent session, not the oldest', () => {
    const ids = usedExerciseIds(
      {
        groups: [],
        workouts: [
          workout('old', '2026-01-01T10:00:00Z', ['old-one']),
          workout('new', '2026-08-01T10:00:00Z', ['new-one']),
        ],
      },
      1,
    );
    expect(ids).toEqual(['new-one']);
  });

  it('has nothing to warm for a brand new account', () => {
    expect(usedExerciseIds({ groups: [], workouts: [] })).toEqual([]);
    expect(usedExerciseIds({ groups: undefined, workouts: undefined } as never)).toEqual([]);
  });
});
