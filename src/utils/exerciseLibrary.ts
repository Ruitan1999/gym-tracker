import type { Exercise } from '../types';
import { defaultExercises } from '../data/defaultExercises';

const shippedById = new Map(defaultExercises.map((e) => [e.id, e]));

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
export function mergeExerciseLibrary(stored: Exercise[] | undefined | null): Exercise[] {
  if (!stored || stored.length === 0) return defaultExercises;

  const storedIds = new Set(stored.map((e) => e.id));
  const merged = stored.map((entry) => {
    const shipped = shippedById.get(entry.id);
    // Body parts landed after these rows were written; take ours where the
    // row is one of ours, without touching a name that may have been changed.
    if (shipped && !entry.bodyPart) return { ...entry, bodyPart: shipped.bodyPart };
    return entry;
  });

  for (const shipped of defaultExercises) {
    if (!storedIds.has(shipped.id)) merged.push(shipped);
  }
  return merged;
}
