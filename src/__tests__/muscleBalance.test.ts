import { describe, it, expect } from 'vitest';
import { buildMuscleBalance, windowStart } from '../utils/muscleBalance';
import type { Exercise, Workout } from '../types';

const exercises: Exercise[] = [
  { id: 'bench', name: 'Bench', bodyPart: 'chest', isCustom: false },
  { id: 'row', name: 'Row', bodyPart: 'back', isCustom: false },
  { id: 'squat', name: 'Squat', bodyPart: 'legs', isCustom: false },
  { id: 'run', name: 'Run', bodyPart: 'cardio', isCustom: false },
];

// Wednesday 28 Oct 2026, 18:00 local
const NOW = new Date(2026, 9, 28, 18, 0);

function workout(date: string, saved: Date, lifts: [string, number][]): Workout {
  return {
    id: `w-${date}-${Math.random()}`,
    date,
    createdAt: saved.toISOString(),
    entries: lifts.map(([exerciseId, sets], i) => ({
      id: `e${i}`,
      exerciseId,
      sets: Array.from({ length: sets }, (_, n) => ({ setNumber: n + 1, reps: 8, weightKg: 40 })),
    })),
  };
}

describe('windowStart', () => {
  it('counts today as day one of the window', () => {
    expect(windowStart('week', NOW)).toBe('2026-10-22');
    expect(windowStart('30d', NOW)).toBe('2026-09-29');
    expect(windowStart('90d', NOW)).toBe('2026-07-31');
    expect(windowStart('all', NOW)).toBeNull();
  });
});

describe('buildMuscleBalance', () => {
  const ws = [
    workout('2026-10-28', new Date(2026, 9, 28, 10), [['bench', 3]]),
    workout('2026-10-20', new Date(2026, 9, 20, 10), [['row', 4]]),
    workout('2026-09-01', new Date(2026, 8, 1, 10), [['squat', 5]]),
  ];

  it('adds up sets inside each window', () => {
    expect(buildMuscleBalance(ws, exercises, 'week', NOW).sets).toEqual({ chest: 3 });
    expect(buildMuscleBalance(ws, exercises, '30d', NOW).sets).toEqual({ chest: 3, back: 4 });
    expect(buildMuscleBalance(ws, exercises, '90d', NOW).sets).toEqual({ chest: 3, back: 4, legs: 5 });
    expect(buildMuscleBalance(ws, exercises, 'all', NOW).sets).toEqual({ chest: 3, back: 4, legs: 5 });
  });

  it('keeps a session on the first day of the window and drops the day before', () => {
    const edge = [
      workout('2026-10-22', new Date(2026, 9, 22, 9), [['bench', 1]]),
      workout('2026-10-21', new Date(2026, 9, 21, 9), [['row', 1]]),
    ];
    expect(buildMuscleBalance(edge, exercises, 'week', NOW).sets).toEqual({ chest: 1 });
  });

  it('lists muscle groups with no sets as untrained, head to toe, never cardio', () => {
    const { untrained } = buildMuscleBalance(ws, exercises, 'week', NOW);
    expect(untrained).toEqual(['back', 'shoulders', 'arms', 'forearms', 'core', 'legs', 'calves', 'neck']);
    expect(untrained).not.toContain('cardio');
  });

  it('still tallies cardio sets but never calls cardio untrained or recovering', () => {
    const cardio = [workout('2026-10-28', new Date(2026, 9, 28, 12), [['run', 2]])];
    const b = buildMuscleBalance(cardio, exercises, 'week', NOW);
    expect(b.sets).toEqual({ cardio: 2 });
    expect(b.untrained).not.toContain('cardio');
    expect(b.recovering).toEqual([]);
  });

  it('treats the last 48 hours as recovering', () => {
    const recent = [
      workout('2026-10-26', new Date(2026, 9, 26, 19), [['bench', 3]]), // 47h ago
      workout('2026-10-26', new Date(2026, 9, 26, 17), [['row', 3]]), // 49h ago
      workout('2026-10-27', new Date(2026, 9, 27, 8), [['squat', 3]]),
    ];
    expect(buildMuscleBalance(recent, exercises, '30d', NOW).recovering).toEqual(['chest', 'legs']);
  });

  it('does not depend on the window for recovery', () => {
    const b = buildMuscleBalance(
      [workout('2026-10-28', new Date(2026, 9, 28, 9), [['bench', 2]])],
      exercises,
      'week',
      NOW,
    );
    expect(b.recovering).toEqual(['chest']);
  });

  it('dates a session logged after the fact by its training day', () => {
    // Trained on the 20th, typed in today: not recovering.
    const late = [workout('2026-10-20', new Date(2026, 9, 28, 17), [['bench', 3]])];
    expect(buildMuscleBalance(late, exercises, '30d', NOW).recovering).toEqual([]);
  });

  it('falls back to the training day when the save time is unusable', () => {
    const bad = { ...workout('2026-10-27', NOW, [['bench', 1]]), createdAt: 'nonsense' };
    expect(buildMuscleBalance([bad], exercises, 'week', NOW).recovering).toEqual(['chest']);
  });

  it('skips exercises that are not in the library and sets never done', () => {
    const odd = [
      workout('2026-10-28', new Date(2026, 9, 28, 9), [['ghost', 4]]),
      {
        ...workout('2026-10-28', new Date(2026, 9, 28, 9), []),
        entries: [{ id: 'z', exerciseId: 'bench', sets: [{ setNumber: 1, reps: 0, weightKg: 40 }] }],
      },
    ];
    const b = buildMuscleBalance(odd, exercises, 'week', NOW);
    expect(b.sets).toEqual({});
    expect(b.recovering).toEqual([]);
  });

  it('ignores sessions dated in the future', () => {
    const future = [workout('2026-10-30', new Date(2026, 9, 30, 9), [['bench', 3]])];
    expect(buildMuscleBalance(future, exercises, 'all', NOW).sets).toEqual({});
  });

  it('is all untrained, nothing else, for empty data', () => {
    const b = buildMuscleBalance([], exercises, '30d', NOW);
    expect(b.sets).toEqual({});
    expect(b.recovering).toEqual([]);
    expect(b.untrained).toHaveLength(9);
  });
});
