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

function withBodyPart(stored: StoredExercise, shipped?: Exercise): Exercise {
  if (stored.bodyPart) return stored as Exercise;
  const bodyPart =
    shipped?.bodyPart ??
    (stored.category ? CATEGORY_TO_BODY_PART[stored.category] : undefined) ??
    'core';
  return { ...stored, bodyPart };
}

export interface MergeOptions {
  /** Shipped exercises this owner has deleted, which must not come back. */
  deleted?: string[];
  /** Shipped exercises this owner has renamed, whose name is theirs to keep. */
  renamed?: string[];
  /**
   * The library as everyone should currently see it — the shipped one with any
   * admin corrections already applied.
   */
  shipped?: Exercise[];
  /**
   * Exercises this owner has actually logged. An exercise retired from the
   * library is kept for them anyway, or their history loses the name of
   * something they really did.
   */
  keep?: string[];
}

/**
 * Folds the shipped library into the one an account has stored.
 *
 * Every account keeps its own copy, because a rename or a deletion has to
 * survive. That copy used to be taken as final, which meant an account never
 * saw anything added or corrected since it was written. So the shipped entry
 * now wins on name and body part — that is what makes an admin correction
 * reach anybody — except where this owner renamed it themselves.
 */
export function mergeExerciseLibrary(
  stored: Exercise[] | undefined | null,
  { deleted = [], renamed = [], shipped = defaultExercises, keep = [] }: MergeOptions = {},
): Exercise[] {
  const gone = new Set(deleted);
  const ownName = new Set(renamed);
  const logged = new Set(keep);
  const shippedNow = new Map(shipped.map((e) => [e.id, e]));

  if (!stored || stored.length === 0) {
    return gone.size === 0 ? shipped : shipped.filter((e) => !gone.has(e.id));
  }

  const merged: Exercise[] = [];
  for (const raw of stored) {
    const entry = raw as StoredExercise;
    const current = shippedNow.get(entry.id);
    if (!current) {
      // Not in the library any more: either this owner deleted it or an admin
      // retired it. Their own exercises are theirs to keep, and so is anything
      // they have logged — history should not lose the name of a real session.
      if (!entry.isCustom && !logged.has(entry.id)) continue;
      merged.push(withBodyPart(entry));
      continue;
    }
    merged.push({
      ...withBodyPart(entry, current),
      name: ownName.has(entry.id) ? entry.name : current.name,
      bodyPart: current.bodyPart,
    });
  }

  const held = new Set(merged.map((e) => e.id));
  for (const entry of shipped) {
    if (held.has(entry.id) || gone.has(entry.id)) continue;
    merged.push(entry);
  }
  return merged;
}

/**
 * Deleting or renaming one of ours has to be remembered; doing it to one of
 * the owner's own does not, because nothing will ever put it back or overwrite
 * it.
 */
export function isShippedExercise(id: string): boolean {
  return shippedById.has(id);
}

/** Every exercise this owner has a set logged against. */
export function loggedExerciseIds(workouts: { entries: { exerciseId: string }[] }[] = []): string[] {
  const ids = new Set<string>();
  for (const workout of workouts ?? []) {
    for (const entry of workout.entries ?? []) ids.add(entry.exerciseId);
  }
  return [...ids];
}
