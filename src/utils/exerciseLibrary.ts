import type { BodyPart, Exercise, LegacyExerciseCategory } from '../types';
import { defaultExercises } from '../data/defaultExercises';

const shippedById = new Map(defaultExercises.map((e) => [e.id, e]));

/**
 * Exercises used to be filed by movement pattern. A pattern doesn't name a
 * body part — "push" is chest, shoulders or triceps depending on the exercise —
 * so for the library's own entries the shipped body part is taken instead, and
 * this is only reached for exercises somebody made up themselves.
 */
const CATEGORY_TO_BODY_PART: Record<LegacyExerciseCategory, BodyPart> = {
  push: 'chest',
  pull: 'back',
  legs: 'legs',
  core: 'core',
  cardio: 'cardio',
};

/** What a stored exercise may look like: predating body parts, or predating both. */
type StoredExercise = Omit<Exercise, 'bodyPart'> & {
  bodyPart?: BodyPart;
  category?: LegacyExerciseCategory;
};

function withBodyPart(stored: StoredExercise): Exercise {
  if (stored.bodyPart) return stored as Exercise;
  const shipped = shippedById.get(stored.id);
  const bodyPart =
    shipped?.bodyPart ??
    (stored.category ? CATEGORY_TO_BODY_PART[stored.category] : undefined) ??
    'core';
  return { ...stored, bodyPart };
}

/**
 * Folds newly shipped exercises into a library that was stored before they
 * existed.
 *
 * Every account keeps its own copy of the library, because a rename or a
 * deletion has to survive. That copy was previously taken as final, so an
 * account created last week would never see anything added since — the stored
 * list simply won a `??`. Merging keeps the stored entry wherever there is one,
 * since that is where a rename lives, and appends the rest.
 */
export function mergeExerciseLibrary(
  stored: Exercise[] | undefined | null,
  deletedIds: string[] = [],
): Exercise[] {
  const deleted = new Set(deletedIds);
  if (!stored || stored.length === 0) {
    return deleted.size === 0
      ? defaultExercises
      : defaultExercises.filter((e) => !deleted.has(e.id));
  }

  const storedIds = new Set(stored.map((e) => e.id));
  const merged = stored.map((entry) => withBodyPart(entry as StoredExercise));

  for (const shipped of defaultExercises) {
    if (storedIds.has(shipped.id) || deleted.has(shipped.id)) continue;
    merged.push(shipped);
  }
  return merged;
}

/**
 * Deleting one of ours has to be remembered; deleting one of the owner's own
 * does not, because nothing will ever put it back.
 */
export function isShippedExercise(id: string): boolean {
  return shippedById.has(id);
}
