import { describe, it, expect } from 'vitest';
import {
  currentExerciseId,
  formatSessionVolume,
  sessionProgress,
} from '../utils/sessionProgress';
import type { WorkoutEntry } from '../types';

const entry = (id: string, reps: number[], weightKg = 50, done = false): WorkoutEntry => ({
  id,
  exerciseId: 'x',
  sets: reps.map((r, i) => ({ setNumber: i + 1, reps: r, weightKg })),
  ...(done ? { done } : {}),
});

describe('sessionProgress', () => {
  it('counts a set as done once it has reps, and sums reps x weight over those', () => {
    const p = sessionProgress([entry('a', [10, 8, 0], 20), entry('b', [5, 0], 100)]);
    expect(p.setsDone).toBe(3);
    expect(p.totalSets).toBe(5);
    expect(p.volumeKg).toBe(10 * 20 + 8 * 20 + 5 * 100);
    expect(p.exercises.map((e) => e.fraction)).toEqual([2 / 3, 0.5]);
  });

  it('ignores empty sets, bodyweight sets and bad weights in the volume', () => {
    const p = sessionProgress([entry('a', [0, 0]), entry('b', [12], 0), entry('c', [5], NaN)]);
    expect(p.volumeKg).toBe(0);
    expect(p.setsDone).toBe(2);
  });

  it('handles an exercise with no sets and an empty session', () => {
    expect(sessionProgress([]).totalSets).toBe(0);
    expect(sessionProgress([entry('a', [])]).exercises[0].fraction).toBe(0);
  });

  it('carries the done flag through', () => {
    expect(sessionProgress([entry('a', [5], 50, true)]).exercises[0].done).toBe(true);
  });
});

describe('currentExerciseId', () => {
  const ex = sessionProgress([entry('a', [5], 1, true), entry('b', [0]), entry('c', [0])]).exercises;

  it('is the first exercise not yet done', () => {
    expect(currentExerciseId(ex, null)).toBe('b');
  });
  it('is the one tapped last while it is still open', () => {
    expect(currentExerciseId(ex, 'c')).toBe('c');
  });
  it('falls back once the tapped one is done or gone', () => {
    expect(currentExerciseId(ex, 'a')).toBe('b');
    expect(currentExerciseId(ex, 'zzz')).toBe('b');
  });
  it('is none when everything is done', () => {
    const all = sessionProgress([entry('a', [5], 1, true)]).exercises;
    expect(currentExerciseId(all, null)).toBeNull();
  });
});

describe('formatSessionVolume', () => {
  it('is compact and in the chosen unit', () => {
    expect(formatSessionVolume(700, 'kg')).toBe('700 kg');
    expect(formatSessionVolume(1500, 'kg')).toBe('1.5K kg');
    expect(formatSessionVolume(100, 'lb')).toBe('220 lb');
  });
});
