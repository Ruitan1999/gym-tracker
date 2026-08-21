import { describe, it, expect } from 'vitest';
import { exerciseImageUrl } from '../utils/exerciseImage';
import { OWN_EXERCISE_IMAGE_IDS } from '../data/exerciseImages';
import { defaultExercises } from '../data/defaultExercises';

describe('exerciseImageUrl', () => {
  it('resolves an imported exercise by convention', () => {
    expect(exerciseImageUrl('ex-gv-0001')).toBe('/exercise-images/ex-gv-0001.jpg');
  });

  it('resolves one of ours that was matched to a picture', () => {
    const id = [...OWN_EXERCISE_IMAGE_IDS][0];
    expect(exerciseImageUrl(id)).toBe(`/exercise-images/${id}.jpg`);
  });

  it('returns null for an exercise with no picture', () => {
    expect(exerciseImageUrl('custom-1')).toBeNull();
    expect(exerciseImageUrl('')).toBeNull();
  });

  it('only claims pictures for ids that are really in the library', () => {
    const known = new Set(defaultExercises.map((e) => e.id));
    for (const id of OWN_EXERCISE_IMAGE_IDS) {
      expect(known.has(id)).toBe(true);
    }
  });
});
