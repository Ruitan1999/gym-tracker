import { describe, it, expect } from 'vitest';
import { thisWeek } from '../utils/thisWeek';
import type { Workout, WorkoutGroup } from '../types';

// Wednesday 28 October 2026; the week runs Mon 26 to Sun 1 Nov.
const WED = new Date(2026, 9, 28, 10, 0);

const w = (date: string): Workout => ({ id: date, date, entries: [], createdAt: `${date}T12:00:00Z` });
const g = (id: string, days: number[]): WorkoutGroup => ({
  id,
  name: id,
  exerciseIds: [],
  createdAt: '2026-01-01T00:00:00Z',
  days,
});

describe('thisWeek', () => {
  it('runs Monday to Sunday with the right dates, across a month end', () => {
    const { days } = thisWeek([], [], 'week', WED);
    expect(days.map((d) => d.dayOfMonth)).toEqual([26, 27, 28, 29, 30, 31, 1]);
    expect(days.findIndex((d) => d.isToday)).toBe(2);
    expect(days[6].iso).toBe('2026-11-01');
  });

  it('marks trained days and counts them', () => {
    const week = thisWeek([w('2026-10-26'), w('2026-10-28'), w('2026-10-20')], [], 'week', WED);
    expect(week.days.filter((d) => d.trained).map((d) => d.dayOfMonth)).toEqual([26, 28]);
    expect(week.trainedDays).toBe(2);
  });

  it('marks planned days from today on, and counts the week target', () => {
    const week = thisWeek([], [g('push', [0]), g('pull', [2]), g('legs', [4])], 'week', WED);
    expect(week.days.filter((d) => d.scheduled).map((d) => d.dayOfMonth)).toEqual([28, 30]);
    expect(week.plannedDays).toBe(3);
  });

  it('plans nothing in rotation, keeping the days in the data', () => {
    const groups = [g('push', [0]), g('pull', [4])];
    const week = thisWeek([], groups, 'rotation', WED);
    expect(week.days.some((d) => d.scheduled)).toBe(false);
    expect(week.plannedDays).toBe(0);
    expect(groups[1].days).toEqual([4]);
  });
});
