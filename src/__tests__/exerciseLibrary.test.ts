import { describe, it, expect } from 'vitest';
import { mergeExerciseLibrary } from '../utils/exerciseLibrary';
import { defaultExercises } from '../data/defaultExercises';
import type { Exercise } from '../types';

describe('mergeExerciseLibrary', () => {
  it('hands back the shipped library when nothing is stored', () => {
    expect(mergeExerciseLibrary(undefined)).toEqual(defaultExercises);
    expect(mergeExerciseLibrary([])).toEqual(defaultExercises);
  });

  it('adds exercises that shipped after the library was stored', () => {
    // What an existing account looks like: a copy of an older, shorter list.
    const stored = defaultExercises.slice(0, 5);

    const merged = mergeExerciseLibrary(stored);

    expect(merged).toHaveLength(defaultExercises.length);
    for (const shipped of defaultExercises) {
      expect(merged.some((e) => e.id === shipped.id)).toBe(true);
    }
  });

  it('keeps a renamed exercise renamed', () => {
    const renamed: Exercise = { ...defaultExercises[0], name: 'My Own Name' };

    const merged = mergeExerciseLibrary([renamed]);

    expect(merged.find((e) => e.id === renamed.id)!.name).toBe('My Own Name');
    // And exactly once — the shipped copy must not come back alongside it.
    expect(merged.filter((e) => e.id === renamed.id)).toHaveLength(1);
  });

  it('keeps custom exercises, and keeps them first', () => {
    const custom: Exercise = { id: 'custom-1', name: 'Custom Ex', category: 'push', isCustom: true };

    const merged = mergeExerciseLibrary([custom]);

    expect(merged[0]).toEqual(custom);
    expect(merged).toHaveLength(defaultExercises.length + 1);
  });

  it('fills in a body part missing from a row stored before they existed', () => {
    const { bodyPart, ...withoutBodyPart } = defaultExercises.find((e) => e.bodyPart)!;
    expect(bodyPart).toBeTruthy();

    const merged = mergeExerciseLibrary([withoutBodyPart as Exercise]);

    expect(merged.find((e) => e.id === withoutBodyPart.id)!.bodyPart).toBe(bodyPart);
  });

  it('leaves a custom exercise without a body part alone', () => {
    const custom: Exercise = { id: 'custom-1', name: 'Custom Ex', category: 'push', isCustom: true };

    const merged = mergeExerciseLibrary([custom]);

    expect(merged[0].bodyPart).toBeUndefined();
  });
});

describe('the shipped library', () => {
  it('has no duplicate ids', () => {
    const ids = new Set(defaultExercises.map((e) => e.id));
    expect(ids.size).toBe(defaultExercises.length);
  });

  it('has no duplicate names', () => {
    const names = new Set(defaultExercises.map((e) => e.name.toLowerCase()));
    expect(names.size).toBe(defaultExercises.length);
  });

  it('gives every exercise a body part', () => {
    expect(defaultExercises.filter((e) => !e.bodyPart)).toEqual([]);
  });

  it('still carries the original ids, which saved workouts point at', () => {
    // Renumbering these would orphan every set ever logged against them.
    for (const id of ['ex-push-001', 'ex-pull-001', 'ex-legs-001', 'ex-core-001', 'ex-cardio-001']) {
      expect(defaultExercises.some((e) => e.id === id)).toBe(true);
    }
  });
});
