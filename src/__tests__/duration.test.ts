import { describe, it, expect } from 'vitest';
import { sessionDurationMs, formatDuration, formatElapsed } from '../utils/duration';

const MIN = 60_000;
const HOUR = 60 * MIN;

describe('sessionDurationMs', () => {
  it('measures start to finish', () => {
    expect(
      sessionDurationMs('2026-08-22T10:00:00.000Z', '2026-08-22T11:12:00.000Z'),
    ).toBe(HOUR + 12 * MIN);
  });

  it('has no answer for a session that was never timed', () => {
    // Everything logged before sessions were timed, and anything entered
    // after the fact — those should show nothing rather than a made-up zero.
    expect(sessionDurationMs(undefined, '2026-08-22T11:00:00.000Z')).toBeNull();
    expect(sessionDurationMs(null, '2026-08-22T11:00:00.000Z')).toBeNull();
    expect(sessionDurationMs('2026-08-22T10:00:00.000Z', undefined)).toBeNull();
  });

  it('refuses nonsense rather than reporting it', () => {
    expect(sessionDurationMs('not a date', '2026-08-22T11:00:00.000Z')).toBeNull();
    expect(sessionDurationMs('2026-08-22T10:00:00.000Z', 'nope')).toBeNull();
    // Saved before it started: a clock that moved backwards, not a duration.
    expect(
      sessionDurationMs('2026-08-22T11:00:00.000Z', '2026-08-22T10:00:00.000Z'),
    ).toBeNull();
  });

  it('counts a session that ran past midnight', () => {
    expect(
      sessionDurationMs('2026-08-22T23:30:00.000Z', '2026-08-23T00:45:00.000Z'),
    ).toBe(HOUR + 15 * MIN);
  });

  it('treats start and finish together as zero, not as missing', () => {
    const t = '2026-08-22T10:00:00.000Z';
    expect(sessionDurationMs(t, t)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('pads the minutes once there are hours, so the width holds still', () => {
    expect(formatDuration(HOUR + 4 * MIN)).toBe('1h 04m');
    expect(formatDuration(2 * HOUR + 35 * MIN)).toBe('2h 35m');
  });

  it('drops the hours when there are none', () => {
    expect(formatDuration(48 * MIN)).toBe('48m');
    expect(formatDuration(MIN)).toBe('1m');
  });

  it('falls back to seconds below a minute, where they are the whole story', () => {
    expect(formatDuration(38_000)).toBe('38s');
    expect(formatDuration(0)).toBe('0s');
  });

  it('rounds down rather than up, so nothing reads as longer than it was', () => {
    expect(formatDuration(59_999)).toBe('59s');
    expect(formatDuration(2 * HOUR - 1)).toBe('1h 59m');
  });
});

describe('formatElapsed', () => {
  it('always ticks seconds, so it reads as live', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(9_000)).toBe('00:09');
    expect(formatElapsed(9 * MIN + 5_000)).toBe('09:05');
  });

  it('adds hours only once there are some', () => {
    expect(formatElapsed(59 * MIN + 59_000)).toBe('59:59');
    expect(formatElapsed(HOUR)).toBe('1:00:00');
    expect(formatElapsed(HOUR + 5 * MIN + 7_000)).toBe('1:05:07');
  });

  it('never shows a negative clock', () => {
    expect(formatElapsed(-5_000)).toBe('00:00');
  });
});
