import type { BodyPart, Exercise, Workout } from '../types';
import { BODY_PART_ORDER, workedBodyParts } from './bodyParts';
import { localDateKey } from './dateKey';

export type BalanceWindow = 'week' | '30d' | '90d' | 'all';

export const WINDOW_DAYS: Record<Exclude<BalanceWindow, 'all'>, number> = {
  week: 7,
  '30d': 30,
  '90d': 90,
};

/** The simple recovery rule: trained within this long ago. */
export const RECOVERY_HOURS = 48;

/**
 * Cardio is not a muscle group, so it never counts as neglected or as
 * recovering, and the figure has no region for it. It is still tallied so the
 * list can show it.
 */
export const NOT_A_MUSCLE: BodyPart[] = ['cardio'];

export interface MuscleBalance {
  sets: Partial<Record<BodyPart, number>>;
  /** Muscle groups with no sets in the window, head to toe. */
  untrained: BodyPart[];
  /** Muscle groups trained within the last 48 hours, head to toe. */
  recovering: BodyPart[];
}

/** Local YYYY-MM-DD of the first day inside the window, or null for all time. */
export function windowStart(window: BalanceWindow, now: Date): string | null {
  if (window === 'all') return null;
  const days = WINDOW_DAYS[window];
  return localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)));
}

/**
 * When a session ended, as best we know. The save time is right unless the
 * session was logged after the fact for another day, in which case the
 * training day wins (its last moment, so a late entry never looks older).
 */
function endedAt(w: Workout): number {
  const [y, m, d] = w.date.split('-').map(Number);
  const endOfDay = new Date(y, m - 1, d, 23, 59, 59).getTime();
  const saved = Date.parse(w.createdAt);
  if (Number.isNaN(saved)) return endOfDay;
  return localDateKey(new Date(saved)) === w.date ? saved : endOfDay;
}

export function buildMuscleBalance(
  workouts: Workout[],
  exercises: Exercise[],
  window: BalanceWindow,
  now: Date = new Date(),
): MuscleBalance {
  const from = windowStart(window, now);
  const today = localDateKey(now);
  const cutoff = now.getTime() - RECOVERY_HOURS * 3600 * 1000;

  const sets: Partial<Record<BodyPart, number>> = {};
  const recent = new Set<BodyPart>();

  for (const w of workouts) {
    if (w.date > today) continue;
    const inWindow = from === null || w.date >= from;
    // Recovery looks at the clock, not the window, so it is checked even when
    // the window is a week and a session sits on its edge.
    const isRecent = endedAt(w) >= cutoff;
    if (!inWindow && !isRecent) continue;

    const worked = workedBodyParts(w, exercises);
    for (const part of Object.keys(worked) as BodyPart[]) {
      if (inWindow) sets[part] = (sets[part] ?? 0) + (worked[part] ?? 0);
      if (isRecent) recent.add(part);
    }
  }

  const muscles = BODY_PART_ORDER.filter((p) => !NOT_A_MUSCLE.includes(p));
  return {
    sets,
    untrained: muscles.filter((p) => !sets[p]),
    recovering: muscles.filter((p) => recent.has(p)),
  };
}

/** Body parts with sets, most-trained first. */
export function rankedSets(sets: Partial<Record<BodyPart, number>>): [BodyPart, number][] {
  return (Object.entries(sets) as [BodyPart, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
}

/** "1 set", "36 sets". */
export function setCount(n: number): string {
  return `${n} ${n === 1 ? 'set' : 'sets'}`;
}
