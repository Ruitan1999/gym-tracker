import type { BodyPart, Exercise, Workout } from '../types';

/** Roughly head to toe, with cardio — which belongs to no one part — last. */
export const BODY_PART_ORDER: BodyPart[] = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'forearms',
  'core',
  'legs',
  'calves',
  'neck',
  'cardio',
];

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

/** Three letters, because the badge they sit in is a fixed width. */
export const BODY_PART_CODE: Record<BodyPart, string> = {
  chest: 'CHS',
  back: 'BCK',
  shoulders: 'SHD',
  arms: 'ARM',
  forearms: 'FRM',
  core: 'COR',
  legs: 'LEG',
  calves: 'CLF',
  neck: 'NCK',
  cardio: 'CRD',
};

export const BODY_PART_ACCENT: Record<BodyPart, string> = {
  chest: 'var(--color-volt)',
  back: 'var(--color-steel)',
  shoulders: 'var(--color-ember)',
  arms: 'var(--color-blood)',
  forearms: 'var(--color-volt-dim)',
  core: 'var(--color-rust)',
  legs: 'var(--color-done)',
  calves: 'var(--color-done-deep)',
  neck: 'var(--color-text-muted)',
  cardio: 'var(--color-volt-deep)',
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
