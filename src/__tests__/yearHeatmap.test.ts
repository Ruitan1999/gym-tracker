import { describe, it, expect } from 'vitest';
import { buildYearHeatmap, HEATMAP_WEEKS, shortDate } from '../utils/yearHeatmap';
import type { Workout } from '../types';

function workout(
  date: string,
  opts: { kg?: number; reps?: number; minutes?: number; untimed?: boolean } = {},
): Workout {
  const { kg = 50, reps = 10, minutes = 60, untimed = false } = opts;
  const created = new Date(`${date}T12:00:00`);
  return {
    id: `w-${date}-${Math.random()}`,
    date,
    createdAt: created.toISOString(),
    startedAt: untimed ? undefined : new Date(created.getTime() - minutes * 60000).toISOString(),
    entries: [
      { id: 'e', exerciseId: 'x', sets: [{ setNumber: 1, reps, weightKg: kg }] },
    ],
  };
}

function cellFor(map: ReturnType<typeof buildYearHeatmap>, date: string) {
  return map.weeks.flat().find((c) => c.date === date)!;
}

// Wednesday 28 Oct 2026
const TODAY = new Date(2026, 9, 28, 15, 30);

describe('buildYearHeatmap', () => {
  it('is 53 Monday-first weeks ending in the current week', () => {
    const map = buildYearHeatmap([], 'volume', TODAY);
    expect(map.weeks).toHaveLength(HEATMAP_WEEKS);
    expect(map.weeks.every((w) => w.length === 7)).toBe(true);
    // Last column: Mon 26 Oct to Sun 1 Nov, with only Thu onwards still to come.
    const last = map.weeks[HEATMAP_WEEKS - 1];
    expect(last[0].date).toBe('2026-10-26');
    expect(last[2].date).toBe('2026-10-28');
    expect(last[2].isToday).toBe(true);
    expect(last.map((c) => c.future)).toEqual([false, false, false, true, true, true, true]);
    // First column starts a Monday 52 weeks earlier.
    expect(map.weeks[0][0].date).toBe('2025-10-27');
  });

  it('starts every column on a Monday, Sunday last', () => {
    const map = buildYearHeatmap([], 'volume', new Date(2026, 9, 25)); // a Sunday
    expect(map.weeks[HEATMAP_WEEKS - 1][6].date).toBe('2026-10-25');
    expect(map.weeks[HEATMAP_WEEKS - 1][6].isToday).toBe(true);
    expect(map.weeks[HEATMAP_WEEKS - 1][0].date).toBe('2026-10-19');
  });

  it('never skips or repeats a day, including across daylight saving changes', () => {
    for (const today of [new Date(2026, 2, 30), new Date(2026, 10, 2), new Date(2027, 0, 5)]) {
      const days = buildYearHeatmap([], 'time', today).weeks.flat().map((c) => c.date);
      expect(new Set(days).size).toBe(days.length);
      for (let i = 1; i < days.length; i++) {
        const [y0, m0, d0] = days[i - 1].split('-').map(Number);
        const [y1, m1, d1] = days[i].split('-').map(Number);
        expect(new Date(y1, m1 - 1, d1).getTime() - new Date(y0, m0 - 1, d0).getTime()).toBeGreaterThan(0);
        expect(new Date(y0, m0 - 1, d0 + 1).getTime()).toBe(new Date(y1, m1 - 1, d1).getTime());
      }
    }
  });

  it('sums volume as reps times weight, over every session on a day', () => {
    const map = buildYearHeatmap(
      [workout('2026-10-20', { kg: 50, reps: 10 }), workout('2026-10-20', { kg: 20, reps: 5 })],
      'volume',
      TODAY,
    );
    const c = cellFor(map, '2026-10-20');
    expect(c.value).toBe(600);
    expect(c.sessions).toBe(2);
    expect(map.activeDays).toBe(1);
    expect(map.total).toBe(600);
  });

  it('measures time from start to save, and skips sessions with no start time', () => {
    const map = buildYearHeatmap(
      [workout('2026-10-20', { minutes: 45 }), workout('2026-10-21', { untimed: true })],
      'time',
      TODAY,
    );
    expect(cellFor(map, '2026-10-20').value).toBe(45);
    const untimed = cellFor(map, '2026-10-21');
    expect(untimed.value).toBe(0);
    expect(untimed.sessions).toBe(1);
    expect(untimed.level).toBe(0);
    expect(map.untimedSessions).toBe(1);
  });

  it('ignores sessions outside the window and in the future', () => {
    const map = buildYearHeatmap(
      [workout('2024-01-01'), workout('2026-11-03'), workout('2026-10-27')],
      'volume',
      TODAY,
    );
    expect(map.activeDays).toBe(1);
    expect(cellFor(map, '2026-10-30').value).toBe(0);
  });

  it('is all empty for no workouts', () => {
    const map = buildYearHeatmap([], 'time', TODAY);
    expect(map.activeDays).toBe(0);
    expect(map.total).toBe(0);
    expect(map.weeks.flat().every((c) => c.level === 0)).toBe(true);
  });

  it('gives a single busy day the top shade', () => {
    const map = buildYearHeatmap([workout('2026-10-20')], 'volume', TODAY);
    expect(cellFor(map, '2026-10-20').level).toBe(4);
  });

  it('shades by rank, so one huge day does not flatten the rest', () => {
    const days = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05'];
    const ws = days.map((d, i) => workout(d, { kg: 10 * (i + 1), reps: 10 }));
    ws.push(workout('2026-10-06', { kg: 100000, reps: 10 }));
    const map = buildYearHeatmap(ws, 'volume', TODAY);
    const levels = [...days, '2026-10-06'].map((d) => cellFor(map, d).level);
    expect(levels[5]).toBe(4);
    expect(new Set(levels).size).toBe(4);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it('labels months where they begin, without crowding the first one', () => {
    const map = buildYearHeatmap([], 'volume', TODAY);
    const labels = map.months.map((m) => m.label);
    expect(labels[labels.length - 1]).toBe('Oct');
    for (let i = 1; i < map.months.length; i++) {
      expect(map.months[i].col - map.months[i - 1].col).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('shortDate', () => {
  it('formats as day and month', () => {
    expect(shortDate('2026-03-12')).toBe('12 Mar');
    expect(shortDate('2026-10-02')).toBe('2 Oct');
  });
});
