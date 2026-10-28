import type { Workout } from '../types';
import { formatVolume, kgToLb } from './conversions';

/** Total weight moved in one workout, in kg: sum of reps x weight per set. */
function workoutTonnageKg(w: Workout): number {
  let total = 0;
  for (const entry of w.entries) {
    for (const s of entry.sets) {
      const reps = Number(s.reps);
      const kg = Number(s.weightKg);
      // Guards against blanks and NaN so one bad set cannot poison the total.
      // A set with 0 reps or 0 weight adds nothing on its own.
      if (reps > 0 && kg > 0) total += reps * kg;
    }
  }
  return total;
}

/**
 * Lifetime tonnage plus the part of it lifted in the month `monthPrefix`
 * (YYYY-MM). Always kg; convert for display with the user's unit.
 */
export function tonnageKg(
  workouts: Workout[],
  monthPrefix: string,
): { total: number; thisMonth: number } {
  let total = 0;
  let thisMonth = 0;
  for (const w of workouts) {
    const t = workoutTonnageKg(w);
    total += t;
    if (w.date.startsWith(monthPrefix)) thisMonth += t;
  }
  return { total, thisMonth };
}

/** Whole units in the user's unit, grouped (307,450); abbreviated past 9 digits. */
export function formatTonnage(kg: number, unit: 'kg' | 'lb'): string {
  const v = Math.round(unit === 'lb' ? kgToLb(kg) : kg);
  return v >= 1e9 ? formatVolume(v) : v.toLocaleString('en-US');
}
