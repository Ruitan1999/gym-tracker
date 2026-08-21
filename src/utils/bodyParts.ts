import type { BodyPart, Exercise, Workout } from '../types';

/** Ordered biggest-first for the legend, so the headline muscle leads. */
export const BODY_PART_LABELS: Record<BodyPart, string> = {
  chest: 'CHEST',
  back: 'BACK',
  shoulders: 'SHOULDERS',
  arms: 'ARMS',
  forearms: 'FOREARMS',
  core: 'CORE',
  legs: 'LEGS',
  calves: 'CALVES',
  neck: 'NECK',
  cardio: 'CARDIO',
};

/**
 * Sets logged per body part, counting only sets that actually happened — an
 * exercise left at zero reps was set up and abandoned, and shading the map for
 * it would claim work that was never done.
 */
export function workedBodyParts(
  workout: Pick<Workout, 'entries'>,
  exercises: Exercise[],
): Partial<Record<BodyPart, number>> {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const tally: Partial<Record<BodyPart, number>> = {};

  for (const entry of workout.entries) {
    const part = byId.get(entry.exerciseId)?.bodyPart;
    if (!part) continue;
    const sets = entry.sets.filter((s) => s.reps > 0).length;
    if (sets === 0) continue;
    tally[part] = (tally[part] ?? 0) + sets;
  }
  return tally;
}
