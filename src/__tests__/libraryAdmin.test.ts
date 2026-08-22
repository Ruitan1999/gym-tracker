import { describe, it, expect } from 'vitest';
import {
  applyLibraryOverrides,
  readOverrides,
  EMPTY_OVERRIDES,
} from '../utils/libraryOverrides';
import { mergeExerciseLibrary } from '../utils/exerciseLibrary';
import type { Exercise } from '../types';

const base: Exercise[] = [
  { id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: false },
  { id: 'b', name: 'Squat', bodyPart: 'legs', isCustom: false },
];

describe('applyLibraryOverrides', () => {
  it('changes nothing when there is nothing to change', () => {
    expect(applyLibraryOverrides(EMPTY_OVERRIDES, base).exercises).toEqual(base);
  });

  it('renames and re-files', () => {
    const { exercises } = applyLibraryOverrides(
      { ...EMPTY_OVERRIDES, edits: { a: { name: 'Barbell Bench', bodyPart: 'shoulders' } } },
      base,
    );
    expect(exercises[0]).toEqual({
      id: 'a',
      name: 'Barbell Bench',
      bodyPart: 'shoulders',
      isCustom: false,
    });
  });

  it('sets a picture without touching anything else', () => {
    const { exercises, images } = applyLibraryOverrides(
      { ...EMPTY_OVERRIDES, edits: { a: { image: 'https://cdn/a.jpg' } } },
      base,
    );
    expect(images).toEqual({ a: 'https://cdn/a.jpg' });
    expect(exercises[0]).toEqual(base[0]);
  });

  it('adds and removes', () => {
    const { exercises } = applyLibraryOverrides(
      {
        edits: {},
        added: [{ id: 'c', name: 'Sled Push', bodyPart: 'cardio' }],
        removed: ['b'],
      },
      base,
    );
    expect(exercises.map((e) => e.id)).toEqual(['a', 'c']);
  });

  it('will not add an id the library already has', () => {
    const { exercises } = applyLibraryOverrides(
      { ...EMPTY_OVERRIDES, added: [{ id: 'a', name: 'Impostor', bodyPart: 'core' }] },
      base,
    );
    expect(exercises.filter((e) => e.id === 'a')).toHaveLength(1);
    expect(exercises[0].name).toBe('Bench Press');
  });

  it('lets an exercise be edited and then retired', () => {
    const { exercises } = applyLibraryOverrides(
      { edits: { b: { name: 'Back Squat' } }, added: [], removed: ['b'] },
      base,
    );
    expect(exercises.map((e) => e.id)).toEqual(['a']);
  });
});

describe('readOverrides', () => {
  it('accepts nothing at all', () => {
    expect(readOverrides(undefined)).toEqual(EMPTY_OVERRIDES);
    expect(readOverrides({})).toEqual(EMPTY_OVERRIDES);
  });

  it('discards anything malformed rather than trusting the document', () => {
    const parsed = readOverrides({
      edits: null,
      added: [{ id: 'ok', name: 'Fine', bodyPart: 'core' }, { id: 'broken' }, null],
      removed: ['x', 42],
    });
    expect(parsed.edits).toEqual({});
    expect(parsed.added).toEqual([{ id: 'ok', name: 'Fine', bodyPart: 'core' }]);
    expect(parsed.removed).toEqual(['x']);
  });
});

describe('an admin correction reaching an account that already has a library', () => {
  it('replaces the name it had stored', () => {
    const stored: Exercise[] = [{ id: 'a', name: 'Bench Press', bodyPart: 'chest', isCustom: false }];
    const { exercises: shipped } = applyLibraryOverrides(
      { ...EMPTY_OVERRIDES, edits: { a: { name: 'Barbell Bench Press' } } },
      base,
    );

    const merged = mergeExerciseLibrary(stored, { shipped });

    expect(merged.find((e) => e.id === 'a')!.name).toBe('Barbell Bench Press');
  });

  it('leaves a name this owner chose alone', () => {
    const stored: Exercise[] = [{ id: 'a', name: 'My Bench', bodyPart: 'chest', isCustom: false }];
    const { exercises: shipped } = applyLibraryOverrides(
      { ...EMPTY_OVERRIDES, edits: { a: { name: 'Barbell Bench Press' } } },
      base,
    );

    const merged = mergeExerciseLibrary(stored, { shipped, renamed: ['a'] });

    expect(merged.find((e) => e.id === 'a')!.name).toBe('My Bench');
  });

  it('takes a retired exercise out of a stored library too', () => {
    const stored: Exercise[] = base.map((e) => ({ ...e }));
    const { exercises: shipped } = applyLibraryOverrides(
      { ...EMPTY_OVERRIDES, removed: ['b'] },
      base,
    );

    const merged = mergeExerciseLibrary(stored, { shipped });

    expect(merged.map((e) => e.id)).toEqual(['a']);
  });
});
