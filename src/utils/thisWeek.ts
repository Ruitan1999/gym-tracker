import type { TrainingMode, Workout, WorkoutGroup } from '../types';
import { localDateKey } from './dateKey';
import { scheduledDaysThisWeek, weekIndex } from './schedule';

export interface WeekDay {
  /** Local YYYY-MM-DD. */
  iso: string;
  /** Monday-first index, 0 to 6. */
  index: number;
  dayOfMonth: number;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
  /** A template is set for this weekday and it is still ahead (week mode only). */
  scheduled: boolean;
}

export interface ThisWeek {
  days: WeekDay[];
  /** Days this week with at least one session. */
  trainedDays: number;
  /** Weekdays with a template set, the week's target; 0 when there is none to aim at. */
  plannedDays: number;
}

/**
 * Monday to Sunday of the week holding `today`, with what was trained and
 * what is planned. Rotation has no weekdays, so it plans nothing here; the
 * days stay in the data for when week mode comes back.
 */
export function thisWeek(
  workouts: Workout[],
  groups: WorkoutGroup[],
  mode: TrainingMode,
  today: Date = new Date(),
): ThisWeek {
  const day0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const monday = new Date(day0.getFullYear(), day0.getMonth(), day0.getDate() - weekIndex(day0));
  const todayIso = localDateKey(day0);
  const trainedOn = new Set(workouts.map((w) => w.date));
  const planned = mode === 'rotation' ? new Set<number>() : scheduledDaysThisWeek(groups);

  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const iso = localDateKey(d);
    const isFuture = iso > todayIso;
    return {
      iso,
      index: i,
      dayOfMonth: d.getDate(),
      trained: trainedOn.has(iso),
      isToday: iso === todayIso,
      isFuture,
      // A planned day already gone is either trained or missed, and the strip
      // says both of those already.
      scheduled: (isFuture || iso === todayIso) && planned.has(i),
    };
  });

  return {
    days,
    trainedDays: days.filter((d) => d.trained).length,
    plannedDays: planned.size,
  };
}

const NO_GROUPS: WorkoutGroup[] = [];
const cache = new WeakMap<Workout[], WeakMap<WorkoutGroup[], Map<string, ThisWeek>>>();

/**
 * `thisWeek` for today, worked out once per set of data. Home asks for it from
 * two cards; the second asks for what the first already built. Keyed on the
 * arrays themselves (app data is replaced, never edited in place), the mode
 * and the date, so a new day or a new save gives a fresh week.
 */
export function thisWeekFor(
  workouts: Workout[],
  groups: WorkoutGroup[] | undefined,
  mode: TrainingMode,
  todayIso: string,
): ThisWeek {
  const g = groups ?? NO_GROUPS;
  let byGroups = cache.get(workouts);
  if (!byGroups) cache.set(workouts, (byGroups = new WeakMap()));
  let byKey = byGroups.get(g);
  if (!byKey) byGroups.set(g, (byKey = new Map()));
  const key = `${mode}|${todayIso}`;
  let week = byKey.get(key);
  if (!week) {
    week = thisWeek(workouts, g, mode);
    byKey.set(key, week);
  }
  return week;
}
