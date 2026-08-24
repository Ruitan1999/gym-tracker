import type { WorkoutGroup } from '../types';

/**
 * Which weekday a template is trained on.
 *
 * Days are held Monday-first — 0 is Monday, 6 is Sunday — because that is how
 * the week reads everywhere in the app, from the momentum strip to the picker.
 * `Date.getDay()` is Sunday-first, so it is converted at the edges rather than
 * carried around: `todayIndex()` is the only place that conversion belongs.
 */

/** Monday-first, matching the momentum strip. */
export const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;
export const DAY_CODES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;
export const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

/** Sunday-first (what `Date` gives) to Monday-first (what this app uses). */
export function weekIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function todayIndex(now: Date = new Date()): number {
  return weekIndex(now);
}

/** A template's days, cleaned up: in range, deduped and in week order. */
export function scheduledDays(group: Pick<WorkoutGroup, 'days'>): number[] {
  const days = group.days ?? [];
  const seen = new Set<number>();
  for (const d of days) {
    if (Number.isInteger(d) && d >= 0 && d <= 6) seen.add(d);
  }
  return [...seen].sort((a, b) => a - b);
}

export function isScheduledOn(group: Pick<WorkoutGroup, 'days'>, day: number): boolean {
  return scheduledDays(group).includes(day);
}

/** "MON · THU", or null for a template with no days set. */
export function dayCodeLabel(group: Pick<WorkoutGroup, 'days'>): string | null {
  const days = scheduledDays(group);
  if (days.length === 0) return null;
  return days.map((d) => DAY_CODES[d]).join(' · ');
}

/** "Mon and Thu", "Mon, Wed and Fri" — for a sentence rather than a badge. */
export function dayListSentence(days: number[]): string {
  const names = days.map((d) => DAY_CODES[d].charAt(0) + DAY_CODES[d].slice(1).toLowerCase());
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Every template set for a given weekday, in the order they are listed. */
export function templatesOn(groups: WorkoutGroup[], day: number): WorkoutGroup[] {
  return groups.filter((g) => isScheduledOn(g, day));
}

export interface UpcomingTemplate {
  group: WorkoutGroup;
  /** Monday-first index of the day it falls on. */
  day: number;
  /** 1 is tomorrow. Today is never "upcoming" — that is `templatesOn`. */
  daysAway: number;
}

/**
 * The next template due after today, looking a week ahead.
 *
 * Deliberately excludes today: a card that says "next up" while today's
 * session is still there to do would be answering a question nobody asked.
 */
export function nextUpcoming(groups: WorkoutGroup[], today: number): UpcomingTemplate | null {
  for (let ahead = 1; ahead <= 7; ahead++) {
    const day = (today + ahead) % 7;
    const [group] = templatesOn(groups, day);
    if (group) return { group, day, daysAway: ahead };
  }
  return null;
}

/** True when any template has days set, which is what puts the card to work. */
export function hasAnySchedule(groups: WorkoutGroup[]): boolean {
  return groups.some((g) => scheduledDays(g).length > 0);
}

/** The days ahead in this week that are spoken for, for the momentum strip. */
export function scheduledDaysThisWeek(groups: WorkoutGroup[]): Set<number> {
  const days = new Set<number>();
  for (const g of groups) {
    for (const d of scheduledDays(g)) days.add(d);
  }
  return days;
}
