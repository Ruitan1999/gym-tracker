import { describe, it, expect } from 'vitest';
import { weeklyStreak, weekStartIso } from '../utils/streak';

// Wednesday 2026-08-05. Its week opens Monday 2026-08-03.
const WED = new Date(2026, 7, 5);

describe('weekStartIso', () => {
  it('anchors the week to Monday', () => {
    expect(weekStartIso(new Date(2026, 7, 5))).toBe('2026-08-03');
    expect(weekStartIso(new Date(2026, 7, 3))).toBe('2026-08-03');
  });

  it('counts Sunday as the end of the week it closes, not the start of the next', () => {
    expect(weekStartIso(new Date(2026, 7, 9))).toBe('2026-08-03');
    expect(weekStartIso(new Date(2026, 7, 10))).toBe('2026-08-10');
  });
});

describe('weeklyStreak', () => {
  it('is zero with nothing logged', () => {
    expect(weeklyStreak([], WED)).toBe(0);
  });

  it('counts a week once however many sessions it holds', () => {
    expect(weeklyStreak(['2026-08-03', '2026-08-04', '2026-08-05'], WED)).toBe(1);
  });

  it('runs back over consecutive weeks', () => {
    expect(weeklyStreak(['2026-08-04', '2026-07-29', '2026-07-21'], WED)).toBe(3);
  });

  it('does not break on a week that has only just started', () => {
    // Nothing this week yet, but the three before it were trained.
    expect(weeklyStreak(['2026-07-29', '2026-07-21', '2026-07-15'], WED)).toBe(3);
  });

  it('stops at a skipped week', () => {
    // This week and last, then a gap, then two more.
    expect(weeklyStreak(['2026-08-04', '2026-07-29', '2026-07-15', '2026-07-08'], WED)).toBe(2);
  });

  it('is zero once the run is older than the week just gone', () => {
    expect(weeklyStreak(['2026-07-15', '2026-07-08'], WED)).toBe(0);
  });

  it('ignores unparseable dates', () => {
    expect(weeklyStreak(['', 'not-a-date', '2026-08-04'], WED)).toBe(1);
  });
});
