import type { Workout } from '../types';
import { sessionDurationMs } from './duration';

export type HeatmapMode = 'time' | 'volume';

export interface HeatmapCell {
  /** Local YYYY-MM-DD. */
  date: string;
  /** Minutes (time) or kg (volume) summed over every session that day. */
  value: number;
  /** 0 is empty, 1 to 4 are shaded by how the day ranks among the busy days. */
  level: 0 | 1 | 2 | 3 | 4;
  /** Sessions saved on this day, whatever they contributed to the chosen mode. */
  sessions: number;
  /** After today: part of the last column's week, but not a day yet. */
  future: boolean;
  isToday: boolean;
}

export interface YearHeatmap {
  /** Columns, Monday first; each has seven cells. */
  weeks: HeatmapCell[][];
  /** Where a month label sits, as a column index. */
  months: { col: number; label: string }[];
  activeDays: number;
  total: number;
  /** Sessions in the window that carry no start time, so add nothing to Time. */
  untimedSessions: number;
}

export const HEATMAP_WEEKS = 53;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Local calendar dates only. Adding days goes through `new Date(y, m, d + n)`,
 * which the engine normalises on the wall clock, so a daylight-saving change
 * can never skip or repeat a day the way adding 86 400 000 ms would.
 */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** "12 Mar" for a YYYY-MM-DD key. */
export function shortDate(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** Rank among the busy days, so one huge day cannot flatten the rest. */
function levelFor(value: number, sorted: number[]): 0 | 1 | 2 | 3 | 4 {
  if (value <= 0 || sorted.length === 0) return 0;
  // Count of values <= this one; ties land on the higher level.
  let lo = 0;
  let hi = sorted.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] <= value) lo = mid + 1;
    else hi = mid;
  }
  const rank = lo / sorted.length;
  return Math.min(4, Math.max(1, Math.ceil(rank * 4))) as 1 | 2 | 3 | 4;
}

function workoutValue(w: Workout, mode: HeatmapMode): number {
  if (mode === 'time') {
    const ms = sessionDurationMs(w.startedAt, w.createdAt);
    return ms === null ? 0 : Math.round(ms / 60000);
  }
  let sum = 0;
  for (const entry of w.entries) {
    for (const s of entry.sets) {
      if (s.reps > 0 && s.weightKg > 0) sum += s.reps * s.weightKg;
    }
  }
  return sum;
}

/**
 * 53 Monday-first week columns ending with the week that holds `today`, so the
 * last twelve months always fit and the final column is the current week.
 */
export function buildYearHeatmap(
  workouts: Workout[],
  mode: HeatmapMode,
  today: Date = new Date(),
): YearHeatmap {
  const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayKey = dateKey(todayDay);
  const mondayOffset = (todayDay.getDay() + 6) % 7;
  const firstDay = addDays(todayDay, -mondayOffset - (HEATMAP_WEEKS - 1) * 7);
  const firstKey = dateKey(firstDay);

  const byDay = new Map<string, { value: number; sessions: number }>();
  let untimedSessions = 0;
  for (const w of workouts) {
    if (w.date < firstKey || w.date > todayKey) continue;
    const day = byDay.get(w.date) ?? { value: 0, sessions: 0 };
    day.value += workoutValue(w, mode);
    day.sessions += 1;
    byDay.set(w.date, day);
    if (!w.startedAt) untimedSessions += 1;
  }

  const busy = [...byDay.values()]
    .map((d) => d.value)
    .filter((v) => v > 0)
    .sort((a, b) => a - b);

  const weeks: HeatmapCell[][] = [];
  const months: { col: number; label: string }[] = [];
  let activeDays = 0;
  let total = 0;
  let lastMonth = -1;

  for (let c = 0; c < HEATMAP_WEEKS; c++) {
    const column: HeatmapCell[] = [];
    for (let r = 0; r < 7; r++) {
      const day = addDays(firstDay, c * 7 + r);
      const key = dateKey(day);
      const future = key > todayKey;
      const hit = future ? undefined : byDay.get(key);
      const value = hit?.value ?? 0;
      if (value > 0) {
        activeDays += 1;
        total += value;
      }
      column.push({
        date: key,
        value,
        level: levelFor(value, busy),
        sessions: hit?.sessions ?? 0,
        future,
        isToday: key === todayKey,
      });
    }
    weeks.push(column);

    const month = addDays(firstDay, c * 7).getMonth();
    if (month !== lastMonth) {
      months.push({ col: c, label: MONTHS[month] });
      lastMonth = month;
    }
  }

  // A first label squeezed against the next one would overprint it.
  if (months.length > 1 && months[1].col - months[0].col < 3) months.shift();

  return { weeks, months, activeDays, total, untimedSessions };
}
