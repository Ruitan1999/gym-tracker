import { describe, it, expect } from 'vitest';
import { picturesToStore } from '../utils/storePictures';
import { defaultExercises } from '../data/defaultExercises';
import type { Workout, WorkoutGroup } from '../types';

const group = (exerciseIds: string[]): WorkoutGroup => ({
  id: 'g',
  name: 'G',
  exerciseIds,
  createdAt: '2026-01-01T00:00:00Z',
});
const workout = (exerciseId: string): Workout => ({
  id: 'w',
  date: '2026-10-01',
  createdAt: '2026-10-01T10:00:00Z',
  entries: [{ id: 'e', exerciseId, sets: [] }],
});

describe('picturesToStore', () => {
  const data = {
    exercises: defaultExercises,
    groups: [group(['ex-gv-0010'])],
    workouts: [workout('ex-gv-0012')],
  };

  it("puts the account's own exercises first, then the rest of the library", () => {
    const urls = picturesToStore(data, false);
    expect(urls.slice(0, 2)).toEqual([
      '/assets/exercise-images/ex-gv-0010.webp',
      '/assets/exercise-images/ex-gv-0012.webp',
    ]);
    // Every shipped picture, each once.
    expect(urls.length).toBeGreaterThan(1300);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("keeps to the account's own exercises with Data Saver on", () => {
    expect(picturesToStore(data, true)).toEqual([
      '/assets/exercise-images/ex-gv-0010.webp',
      '/assets/exercise-images/ex-gv-0012.webp',
    ]);
  });

  it('leaves out exercises with no shipped picture', () => {
    const urls = picturesToStore(
      { exercises: [{ id: 'mine', name: 'Mine', bodyPart: 'chest', isCustom: true }], groups: [group(['mine'])], workouts: [] },
      false,
    );
    expect(urls).toEqual([]);
  });

  it('skips pictures that have been replaced, since they are never shown', () => {
    const urls = picturesToStore(data, true, { 'ex-gv-0010': 'https://example.com/mine.webp' });
    expect(urls).toEqual(['/assets/exercise-images/ex-gv-0012.webp']);
  });
});
