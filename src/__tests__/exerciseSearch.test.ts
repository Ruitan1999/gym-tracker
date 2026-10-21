import { describe, it, expect } from 'vitest';
import { searchExercises } from '../utils/exerciseSearch';
import type { Exercise } from '../types';

const ex = (name: string, bodyPart: Exercise['bodyPart'] = 'chest'): Exercise => ({
  id: name,
  name,
  bodyPart,
  isCustom: false,
});

const LIBRARY: Exercise[] = [
  ex('Bench Press'),
  ex('Incline Bench Press'),
  ex('Dumbbell Bench Press'),
  ex('Chest Press Machine'),
  ex('Barbell Row', 'back'),
  ex('Narrow Grip Pulldown', 'back'),
  ex('Pull-Up', 'back'),
  ex('Leg Press', 'legs'),
  ex('Preacher Curl', 'arms'),
];

const names = (query: string) => searchExercises(LIBRARY, query).map((e) => e.name);

describe('searching the exercise library', () => {
  it('finds the plainest match first', () => {
    expect(names('bench press')[0]).toBe('Bench Press');
  });

  it('does not care what order the words were typed in', () => {
    expect(names('press bench')).toContain('Bench Press');
  });

  it('matches on the start of a word, so half a word is enough', () => {
    expect(names('inc bench')).toEqual(['Incline Bench Press']);
  });

  it('treats a hyphen and a space as the same thing', () => {
    expect(names('pull up')).toContain('Pull-Up');
    expect(names('pullup')).not.toContain('Pull-Up');
  });

  it('puts a word that starts a name above one buried inside another', () => {
    const results = names('row');
    // "Narrow Grip Pulldown" contains those letters but starts no word with
    // them, so the rows come first.
    expect(results[0]).toBe('Barbell Row');
    expect(results.indexOf('Barbell Row')).toBeLessThan(results.indexOf('Narrow Grip Pulldown'));
  });

  it('narrows as more is typed rather than widening', () => {
    expect(names('press').length).toBeGreaterThan(names('press machine').length);
    expect(names('press machine')).toEqual(['Chest Press Machine']);
  });

  it('finds a body part by name', () => {
    expect(names('back')).toEqual(
      expect.arrayContaining(['Barbell Row', 'Pull-Up', 'Narrow Grip Pulldown']),
    );
    expect(names('back')).not.toContain('Bench Press');
  });

  it('comes back with nothing for a query that matches nothing', () => {
    expect(names('kettlebell swing')).toEqual([]);
  });

  it('ignores surrounding space and case', () => {
    expect(names('  BENCH  ')).toContain('Bench Press');
  });
});
