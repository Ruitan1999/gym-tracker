import { describe, it, expect } from 'vitest';
import {
  weekIndex,
  scheduledDays,
  isScheduledOn,
  dayCodeLabel,
  dayListSentence,
  templatesOn,
  nextUpcoming,
  hasAnySchedule,
  scheduledDaysThisWeek,
} from '../utils/schedule';
import type { WorkoutGroup } from '../types';

const template = (id: string, days?: number[]): WorkoutGroup => ({
  id,
  name: id,
  exerciseIds: ['ex-push-001'],
  createdAt: '2026-01-01T00:00:00Z',
  ...(days ? { days } : {}),
});

describe('the week, Monday first', () => {
  it('reads a Monday as the start of the week', () => {
    // 2026-08-24 is a Monday.
    expect(weekIndex(new Date('2026-08-24T09:00:00'))).toBe(0);
  });

  it('reads a Sunday as the end of it, not the start', () => {
    expect(weekIndex(new Date('2026-08-23T09:00:00'))).toBe(6);
  });

  it('walks through the week in order', () => {
    const days = [24, 25, 26, 27, 28, 29, 30].map((d) =>
      weekIndex(new Date(`2026-08-${d}T09:00:00`)),
    );
    expect(days).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe("a template's days", () => {
  it('has none until some are set', () => {
    expect(scheduledDays(template('t'))).toEqual([]);
    expect(dayCodeLabel(template('t'))).toBeNull();
  });

  it('comes back in week order however they were picked', () => {
    expect(scheduledDays(template('t', [4, 0, 2]))).toEqual([0, 2, 4]);
  });

  it('counts a day once', () => {
    expect(scheduledDays(template('t', [1, 1, 1]))).toEqual([1]);
  });

  it('drops anything that is not a day of the week', () => {
    expect(scheduledDays(template('t', [-1, 0, 7, 3, 99]))).toEqual([0, 3]);
  });

  it('says which days it is, for a badge', () => {
    expect(dayCodeLabel(template('t', [0, 3]))).toBe('MON · THU');
  });

  it('says which days it is, for a sentence', () => {
    expect(dayListSentence([0])).toBe('Mon');
    expect(dayListSentence([0, 3])).toBe('Mon and Thu');
    expect(dayListSentence([0, 2, 4])).toBe('Mon, Wed and Fri');
  });

  it('knows whether a given day is one of them', () => {
    expect(isScheduledOn(template('t', [0, 3]), 3)).toBe(true);
    expect(isScheduledOn(template('t', [0, 3]), 4)).toBe(false);
  });
});

describe('what is on for a day', () => {
  const groups = [template('push', [0, 3]), template('pull', [2, 5]), template('legs')];

  it('finds the template set for it', () => {
    expect(templatesOn(groups, 0).map((g) => g.id)).toEqual(['push']);
    expect(templatesOn(groups, 2).map((g) => g.id)).toEqual(['pull']);
  });

  it('finds nothing on a day nobody claimed', () => {
    expect(templatesOn(groups, 1)).toEqual([]);
  });

  it('finds both when two templates share a day', () => {
    const shared = [template('push', [3]), template('legs', [3])];
    expect(templatesOn(shared, 3).map((g) => g.id)).toEqual(['push', 'legs']);
  });
});

describe('what is coming after today', () => {
  const groups = [template('push', [0, 3]), template('pull', [2, 5])];

  it('finds the next day with something on it', () => {
    // Monday: the next one along is Wednesday's pull day.
    expect(nextUpcoming(groups, 0)).toMatchObject({ day: 2, daysAway: 2 });
    expect(nextUpcoming(groups, 0)?.group.id).toBe('pull');
  });

  it('looks past the end of the week into the next one', () => {
    // Sunday: nothing left this week, so Monday comes round again.
    expect(nextUpcoming(groups, 6)).toMatchObject({ day: 0, daysAway: 1 });
  });

  it('never answers with today, which is not upcoming', () => {
    // Thursday is a push day, but the question is what comes next.
    const next = nextUpcoming(groups, 3);
    expect(next?.daysAway).toBeGreaterThan(0);
    expect(next).toMatchObject({ day: 5 });
  });

  it('comes back with nothing when no template has days', () => {
    expect(nextUpcoming([template('a'), template('b')], 0)).toBeNull();
  });

  it('comes round to itself for a template trained once a week', () => {
    expect(nextUpcoming([template('weekly', [1])], 1)).toMatchObject({ day: 1, daysAway: 7 });
  });
});

describe('the week at a glance', () => {
  it('knows whether anything is scheduled at all', () => {
    expect(hasAnySchedule([template('a'), template('b')])).toBe(false);
    expect(hasAnySchedule([template('a'), template('b', [4])])).toBe(true);
  });

  it('gathers every spoken-for day across the templates', () => {
    const days = scheduledDaysThisWeek([template('push', [0, 3]), template('pull', [2, 3])]);
    expect([...days].sort()).toEqual([0, 2, 3]);
  });
});
