import { describe, it, expect } from 'vitest';
import { getMaxWeightData, getTotalVolumeData } from '../utils/chartHelpers';
import type { Workout } from '../types';

const makeWorkout = (
  id: string,
  date: string,
  exerciseId: string,
  sets: { reps: number; weightKg: number }[]
): Workout => ({
  id,
  date,
  entries: [
    {
      id: `entry-${id}`,
      exerciseId,
      sets: sets.map((s, i) => ({ setNumber: i + 1, ...s })),
    },
  ],
  createdAt: `${date}T00:00:00Z`,
});

const workouts: Workout[] = [
  makeWorkout('w1', '2026-03-15', 'ex-1', [
    { reps: 5, weightKg: 80 },
    { reps: 5, weightKg: 100 },
    { reps: 3, weightKg: 110 },
  ]),
  makeWorkout('w2', '2026-03-10', 'ex-1', [
    { reps: 8, weightKg: 70 },
    { reps: 8, weightKg: 70 },
  ]),
  makeWorkout('w3', '2026-03-20', 'ex-2', [
    { reps: 10, weightKg: 50 },
  ]),
];

describe('chartHelpers', () => {
  describe('getMaxWeightData', () => {
    it('returns the max weight per session for a given exercise', () => {
      const result = getMaxWeightData(workouts, 'ex-1');

      expect(result).toHaveLength(2);
      // Should be sorted by date ascending
      expect(result[0]).toEqual({ date: '2026-03-10', value: 70 });
      expect(result[1]).toEqual({ date: '2026-03-15', value: 110 });
    });

    it('returns empty array when exercise has no workout data', () => {
      const result = getMaxWeightData(workouts, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('returns results sorted by date ascending', () => {
      const result = getMaxWeightData(workouts, 'ex-1');
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date >= result[i - 1].date).toBe(true);
      }
    });
  });

  describe('getTotalVolumeData', () => {
    it('returns correct sum of reps * weight per session', () => {
      const result = getTotalVolumeData(workouts, 'ex-1');

      expect(result).toHaveLength(2);
      // w2 (2026-03-10): 8*70 + 8*70 = 1120
      expect(result[0]).toEqual({ date: '2026-03-10', value: 1120 });
      // w1 (2026-03-15): 5*80 + 5*100 + 3*110 = 400 + 500 + 330 = 1230
      expect(result[1]).toEqual({ date: '2026-03-15', value: 1230 });
    });

    it('returns empty array when exercise has no workout data', () => {
      const result = getTotalVolumeData(workouts, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('returns results sorted by date ascending', () => {
      const result = getTotalVolumeData(workouts, 'ex-1');
      for (let i = 1; i < result.length; i++) {
        expect(result[i].date >= result[i - 1].date).toBe(true);
      }
    });
  });
});
