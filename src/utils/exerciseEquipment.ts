import type { Equipment, Exercise } from '../types';

/** The picker's chips, left to right: the gym floor first, the odd kit last. */
export const EQUIPMENT_ORDER: Equipment[] = [
  'machine',
  'cable',
  'dumbbell',
  'barbell',
  'bodyweight',
  'smith',
  'band',
  'kettlebell',
  'other',
];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  machine: 'Machine',
  cable: 'Cable',
  dumbbell: 'Dumbbell',
  barbell: 'Barbell',
  bodyweight: 'Bodyweight',
  smith: 'Smith',
  band: 'Band',
  kettlebell: 'Kettlebell',
  other: 'Other',
};

/** null is "Any": no narrowing at all. */
export type EquipmentFilter = Equipment | null;

/**
 * Exercises done with the chosen kit, or all of them for "Any".
 *
 * An exercise with no equipment — one of the owner's own, or a stored copy
 * from before the field existed — is not a machine, a cable or anything else,
 * so it only turns up under "Any" rather than being guessed into a chip.
 */
export function filterByEquipment(exercises: Exercise[], equipment: EquipmentFilter): Exercise[] {
  if (!equipment) return exercises;
  return exercises.filter((e) => e.equipment === equipment);
}

/** How many of these there are per kit, so a chip that leads nowhere can be left out. */
export function countByEquipment(exercises: Exercise[]): Partial<Record<Equipment, number>> {
  const counts: Partial<Record<Equipment, number>> = {};
  for (const exercise of exercises) {
    if (exercise.equipment) counts[exercise.equipment] = (counts[exercise.equipment] ?? 0) + 1;
  }
  return counts;
}

/** "Chest · Barbell", or just "Chest" where no kit is known. */
export function exerciseSubtitle(exercise: Exercise, bodyPartName: string): string {
  return exercise.equipment
    ? `${bodyPartName} · ${EQUIPMENT_LABELS[exercise.equipment]}`
    : bodyPartName;
}
