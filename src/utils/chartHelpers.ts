import type { Workout } from '../types';

export interface ChartDataPoint {
  date: string;
  value: number;
}

export function getMaxWeightData(
  workouts: Workout[],
  exerciseId: string
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];

  for (const workout of workouts) {
    for (const entry of workout.entries) {
      if (entry.exerciseId === exerciseId) {
        let maxWeight = 0;
        for (const set of entry.sets) {
          if (set.weightKg > maxWeight) {
            maxWeight = set.weightKg;
          }
        }
        points.push({ date: workout.date, value: maxWeight });
      }
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}

export function getTotalVolumeData(
  workouts: Workout[],
  exerciseId: string
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];

  for (const workout of workouts) {
    for (const entry of workout.entries) {
      if (entry.exerciseId === exerciseId) {
        let volume = 0;
        for (const set of entry.sets) {
          volume += set.reps * set.weightKg;
        }
        points.push({ date: workout.date, value: volume });
      }
    }
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  return points;
}
