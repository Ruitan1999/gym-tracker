import { describe, it, expect } from 'vitest';
import { targetAdvice } from '../utils/targetAdvice';
import type { WorkoutSet } from '../types';

const s = (reps: number, weightKg: number, n = 1): WorkoutSet => ({ setNumber: n, reps, weightKg });

describe('targetAdvice', () => {
  it('says nothing without data', () => {
    expect(targetAdvice(undefined, 'kg', 2.5)).toBeNull();
    expect(targetAdvice(null, 'kg', 2.5)).toBeNull();
    expect(targetAdvice([], 'kg', 2.5)).toBeNull();
    expect(targetAdvice([s(0, 0)], 'kg', 2.5)).toBeNull();
  });

  it('suggests a step up after one set', () => {
    expect(targetAdvice([s(10, 80)], 'kg', 2.5)).toBe('You hit every rep last time. Try 82.5 kg (+2.5).');
  });

  it('treats equal reps as hit', () => {
    expect(targetAdvice([s(8, 60), s(8, 60), s(8, 60)], 'kg', 2.5)).toContain('Try 62.5 kg');
  });

  it('treats rising reps as hit', () => {
    expect(targetAdvice([s(6, 60), s(8, 60)], 'kg', 2.5)).toContain('Try 62.5 kg');
  });

  it('flags the set where reps dropped at the same weight', () => {
    expect(targetAdvice([s(8, 60), s(8, 60), s(6, 60)], 'kg', 2.5)).toBe(
      'Reps dropped on set 3 last time. Same weight again.',
    );
  });

  it('flags a drop mid-way, first drop only', () => {
    expect(targetAdvice([s(8, 60), s(6, 60), s(4, 60)], 'kg', 2.5)).toContain('set 2');
  });

  it('does not call a pyramid a miss', () => {
    expect(targetAdvice([s(10, 20), s(8, 40), s(6, 60)], 'kg', 2.5)).toContain('Try 62.5 kg');
  });

  it('flags a set with zero reps', () => {
    expect(targetAdvice([s(8, 60), s(0, 60)], 'kg', 2.5)).toBe(
      'No reps logged on set 2 last time. Same weight again.',
    );
  });

  it('ignores fully blank rows', () => {
    expect(targetAdvice([s(8, 60), s(0, 0)], 'kg', 2.5)).toContain('Try 62.5 kg');
  });

  it('uses the heaviest weight when sets differ', () => {
    expect(targetAdvice([s(10, 60), s(10, 80), s(10, 70)], 'kg', 2.5)).toContain('Try 82.5 kg');
  });

  it('converts to pounds and rounds', () => {
    // 80 kg = 176.37 lb, plus a 5 lb step.
    expect(targetAdvice([s(10, 80)], 'lb', 5)).toBe('You hit every rep last time. Try 181.37 lb (+5).');
  });

  it('offers no weight for bodyweight work', () => {
    expect(targetAdvice([s(12, 0), s(12, 0)], 'kg', 2.5)).toBe('You hit every rep last time.');
  });

  it('is plain: no emoji or exclamation', () => {
    const out = targetAdvice([s(10, 80)], 'kg', 2.5)!;
    expect(out).not.toMatch(/!/);
  });
});
