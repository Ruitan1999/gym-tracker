import { describe, it, expect } from 'vitest';
import { exerciseImageUrl } from '../utils/exerciseImage';
import { OWN_EXERCISE_IMAGES } from '../data/exerciseImages';
import { defaultExercises } from '../data/defaultExercises';

describe('exerciseImageUrl', () => {
  it('resolves an imported exercise by convention', () => {
    expect(exerciseImageUrl('ex-gv-0001')).toBe('/exercise-images/ex-gv-0001.jpg');
  });

  it('resolves a listed one by its filename, whatever the format', () => {
    const [id, file] = Object.entries(OWN_EXERCISE_IMAGES)[0];
    expect(exerciseImageUrl(id)).toBe(`/exercise-images/${file}`);
  });

  it('lets a listed file win over the convention', () => {
    // An admin replacing an imported exercise's picture with a .png must not
    // still be pointed at the .jpg that is no longer there.
    const listed = Object.keys(OWN_EXERCISE_IMAGES);
    for (const id of listed) {
      expect(exerciseImageUrl(id)).toBe(`/exercise-images/${OWN_EXERCISE_IMAGES[id]}`);
    }
  });

  it('returns null for an exercise with no picture', () => {
    expect(exerciseImageUrl('custom-1')).toBeNull();
    expect(exerciseImageUrl('')).toBeNull();
  });

  it('only claims pictures for ids that are really in the library', () => {
    const known = new Set(defaultExercises.map((e) => e.id));
    for (const id of Object.keys(OWN_EXERCISE_IMAGES)) {
      expect(known.has(id)).toBe(true);
    }
  });
});
