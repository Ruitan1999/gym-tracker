import { describe, it, expect } from 'vitest';
import { mergeAppData } from '../utils/mergeAppData';
import type { AppData } from '../types';
import { DEFAULT_PREFERENCES } from '../types';

const base = (over: Partial<AppData>): AppData => ({
  exercises: [],
  workouts: [],
  groups: [],
  preferences: { ...DEFAULT_PREFERENCES },
  deletedExerciseIds: [],
  renamedExerciseIds: [],
  dataVersion: 1,
  ...over,
});
const w = (id: string, name = id) => ({ id, name, date: '2026-10-01', createdAt: '2026-10-01T10:00:00Z', entries: [] });
const g = (id: string, name = id) => ({ id, name, exerciseIds: [], createdAt: '2026-01-01T00:00:00Z' });

describe('mergeAppData', () => {
  it('never drops what the account has, even from an empty phone', () => {
    const merged = mergeAppData(base({}), base({ workouts: [w('a'), w('b')], groups: [g('t')] }));
    expect(merged.workouts.map((x) => x.id)).toEqual(['a', 'b']);
    expect(merged.groups.map((x) => x.id)).toEqual(['t']);
  });

  it("adds the phone's new work, and the phone's version wins for the same item", () => {
    const merged = mergeAppData(
      base({ workouts: [w('a', 'edited here'), w('new')], groups: [g('t', 'Renamed')] }),
      base({ workouts: [w('a', 'old'), w('b')], groups: [g('t', 'Old'), g('u')] }),
    );
    expect(merged.workouts.map((x) => `${x.id}:${x.name}`)).toEqual(['a:edited here', 'new:new', 'b:b']);
    expect(merged.groups.map((x) => `${x.id}:${x.name}`)).toEqual(['t:Renamed', 'u:u']);
  });

  it('keeps the phone preferences and unions the id lists and pictures', () => {
    const merged = mergeAppData(
      base({ preferences: { ...DEFAULT_PREFERENCES, weightUnit: 'lb' }, deletedExerciseIds: ['x'], exerciseImages: { a: 'mine' } }),
      base({ deletedExerciseIds: ['y'], exerciseImages: { a: 'theirs', b: 'theirs' }, dataVersion: 2 }),
    );
    expect(merged.preferences.weightUnit).toBe('lb');
    expect(merged.deletedExerciseIds?.sort()).toEqual(['x', 'y']);
    expect(merged.exerciseImages).toEqual({ a: 'mine', b: 'theirs' });
    expect(merged.dataVersion).toBe(2);
  });
});
