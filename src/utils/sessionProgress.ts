import type { WorkoutEntry } from '../types';
import { formatVolume, kgToLb } from './conversions';

export interface ExerciseProgress {
  id: string;
  /** Sets with reps logged. Sets arrive pre-sized and empty, so reps is the tick. */
  setsDone: number;
  totalSets: number;
  done: boolean;
  /** 0..1, of this exercise's own sets. */
  fraction: number;
}

export interface SessionProgress {
  setsDone: number;
  totalSets: number;
  /** Reps x weight over the sets done, always kg; convert for display. */
  volumeKg: number;
  exercises: ExerciseProgress[];
}

/** Same rule the rest timer uses: a set is done once its reps go above zero. */
function isSetDone(reps: number): boolean {
  return reps > 0;
}

export function sessionProgress(entries: WorkoutEntry[]): SessionProgress {
  let setsDone = 0;
  let totalSets = 0;
  let volumeKg = 0;
  const exercises = entries.map((entry) => {
    let done = 0;
    for (const s of entry.sets) {
      if (!isSetDone(s.reps)) continue;
      done += 1;
      // A blank or NaN weight must not poison the running total.
      const kg = Number(s.weightKg);
      if (kg > 0) volumeKg += s.reps * kg;
    }
    setsDone += done;
    totalSets += entry.sets.length;
    return {
      id: entry.id,
      setsDone: done,
      totalSets: entry.sets.length,
      done: !!entry.done,
      fraction: entry.sets.length > 0 ? done / entry.sets.length : 0,
    };
  });
  return { setsDone, totalSets, volumeKg, exercises };
}

/**
 * The chip that is ringed: the one you last tapped while it is still open,
 * otherwise the first exercise not yet marked done. None once all are done.
 */
export function currentExerciseId(
  exercises: ExerciseProgress[],
  tappedId: string | null,
): string | null {
  const tapped = tappedId ? exercises.find((e) => e.id === tappedId) : undefined;
  if (tapped && !tapped.done) return tapped.id;
  return exercises.find((e) => !e.done)?.id ?? null;
}

/** "700 kg", "1.2K lb": compact so it fits at the end of a thin bar. */
export function formatSessionVolume(volumeKg: number, unit: 'kg' | 'lb'): string {
  const v = unit === 'lb' ? kgToLb(volumeKg) : volumeKg;
  return `${formatVolume(v)} ${unit}`;
}
