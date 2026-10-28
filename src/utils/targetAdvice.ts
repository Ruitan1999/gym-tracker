import type { WorkoutSet } from '../types';
import { kgToLb } from './conversions';

/** 82.5 not 82.50, 80 not 80.0. */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/**
 * One plain sentence about what to aim for, worked out from last session's sets
 * for the exercise and nothing else. Advice only: it never produces a number
 * anyone could apply, so it cannot fill in or change a set.
 *
 * "Hit every rep" means no set had fewer reps than the set before it (unless
 * that set was also heavier, which is a pyramid, not a miss) and every set
 * had at least one rep. Weights are stored in kg; `step` is the increment in
 * the unit being shown.
 */
export function targetAdvice(
  previousSets: WorkoutSet[] | null | undefined,
  unit: 'kg' | 'lb',
  step: number,
): string | null {
  if (!previousSets || previousSets.length === 0) return null;
  // Rows left blank carry no information about how the session went.
  const sets = previousSets.filter((s) => (Number(s.reps) || 0) > 0 || (Number(s.weightKg) || 0) > 0);
  if (sets.length === 0 || sets.every((s) => !(Number(s.reps) > 0))) return null;

  for (let i = 0; i < sets.length; i++) {
    const reps = Number(sets[i].reps) || 0;
    const weight = Number(sets[i].weightKg) || 0;
    if (reps <= 0) return `No reps logged on set ${i + 1} last time. Same weight again.`;
    if (i === 0) continue;
    const prevReps = Number(sets[i - 1].reps) || 0;
    const prevWeight = Number(sets[i - 1].weightKg) || 0;
    if (reps < prevReps && weight <= prevWeight) {
      return `Reps dropped on set ${i + 1} last time. Same weight again.`;
    }
  }

  const topKg = Math.max(...sets.map((s) => Number(s.weightKg) || 0));
  // Bodyweight work has no weight to add to.
  if (topKg <= 0 || !(step > 0)) return 'You hit every rep last time.';
  const top = unit === 'lb' ? kgToLb(topKg) : topKg;
  return `You hit every rep last time. Try ${fmt(top + step)} ${unit} (+${fmt(step)}).`;
}
