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

  it('keeps a rename this owner actually made', () => {
    const renamed: Exercise = { ...defaultExercises[0], name: 'My Own Name' };

    const merged = mergeExerciseLibrary([renamed], { renamed: [renamed.id] });

    expect(merged.find((e) => e.id === renamed.id)!.name).toBe('My Own Name');
    // And exactly once — the shipped copy must not come back alongside it.
    expect(merged.filter((e) => e.id === renamed.id)).toHaveLength(1);
  });

  it('takes the library\'s name back where the owner never renamed anything', () => {
    // Every account holds a full copy of the library, so a stored name is not
    // evidence of a rename. Treating it as one is what stopped a correction to
    // the library from ever reaching anybody.
    const stale: Exercise = { ...defaultExercises[0], name: 'Old Shipped Name' };

    const merged = mergeExerciseLibrary([stale]);

    expect(merged.find((e) => e.id === stale.id)!.name).toBe(defaultExercises[0].name);
  });

  it('keeps custom exercises, and keeps them first', () => {
    const custom: Exercise = { id: 'custom-1', name: 'Custom Ex', bodyPart: 'chest', isCustom: true };

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

  it('carries a custom exercise across from the movement pattern it was filed under', () => {
    // Made up by hand back when exercises were push/pull/legs/core/cardio.
    const legacy = { id: 'custom-1', name: 'Custom Ex', category: 'pull', isCustom: true };

    const merged = mergeExerciseLibrary([legacy as unknown as Exercise]);

    expect(merged[0].bodyPart).toBe('back');
    expect(merged[0].name).toBe('Custom Ex');
  });

  it('gives a body part to a custom exercise that has neither', () => {
    const orphan = { id: 'custom-2', name: 'Mystery', isCustom: true };

    const merged = mergeExerciseLibrary([orphan as unknown as Exercise]);

    // Whatever it lands on, nothing downstream may be handed an exercise
    // without one — grouping and the body map both index straight off it.
    expect(merged[0].bodyPart).toBeTruthy();
  });
});

describe('migrating a library stored under movement patterns', () => {
  it('takes the shipped body part rather than guessing from the pattern', () => {
    // "push" covers chest, shoulders and triceps, so the pattern can't say
    // which. For exercises we ship, the answer is already known.
    const shipped = defaultExercises.find((e) => e.bodyPart === 'shoulders')!;
    const asStored = {
      id: shipped.id,
      name: shipped.name,
      category: 'push',
      isCustom: false,
    };

    const merged = mergeExerciseLibrary([asStored as unknown as Exercise]);

    expect(merged.find((e) => e.id === shipped.id)!.bodyPart).toBe('shoulders');
  });

  it('gives every exercise a body part, whatever shape it arrived in', () => {
    const mixed = [
      { id: 'ex-push-001', name: 'Bench Press', category: 'push', isCustom: false },
      { id: 'custom-1', name: 'Mine', category: 'cardio', isCustom: true },
      { id: 'custom-2', name: 'Older', isCustom: true },
    ];

    const merged = mergeExerciseLibrary(mixed as unknown as Exercise[]);

    expect(merged.filter((e) => !e.bodyPart)).toEqual([]);
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
