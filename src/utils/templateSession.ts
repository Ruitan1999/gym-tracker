import type { Workout, WorkoutEntry, WorkoutGroup, WorkoutSet } from '../types';

/**
 * The session a template turns into, and where it waits until the form picks
 * it up.
 *
 * This lives apart from the form because the home screen can now start a
 * session too — from the Next Up card — and both have to hand the form exactly
 * the same thing.
 */
export const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

export interface Draft {
  date: string;
  name?: string;
  entries: WorkoutEntry[];
  notes: string;
  collapsedIds: string[];
  /** The template this session was started from, if any. */
  sourceGroupId?: string;
  /** When the clock started, so it survives a reload mid-session. */
  startedAt?: string;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function todayString(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * What this exercise was last done for, so a session opens on the weights the
 * owner actually lifted rather than on zeroes.
 */
export function lastSetsFor(workouts: Workout[], exerciseId: string): WorkoutSet[] | null {
  const sorted = [...workouts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const w of sorted) {
    const entry = w.entries.find((e) => e.exerciseId === exerciseId);
    if (entry && entry.sets.length > 0) {
      return entry.sets.map((s, i) => ({ setNumber: i + 1, reps: s.reps, weightKg: s.weightKg }));
    }
  }
  return null;
}

export function entriesFromTemplate(group: WorkoutGroup, workouts: Workout[]): WorkoutEntry[] {
  return group.exerciseIds.map((exerciseId) => {
    const lastSets = lastSetsFor(workouts, exerciseId);
    return {
      id: crypto.randomUUID(),
      exerciseId,
      // The count carries over, not the numbers: how many sets is the plan,
      // what went on the bar is today's business.
      sets: lastSets
        ? lastSets.map((_, j) => ({ setNumber: j + 1, reps: 0, weightKg: 0 }))
        : [{ setNumber: 1, reps: 0, weightKg: 0 }],
    };
  });
}

/**
 * A session ready to be opened, with every exercise folded.
 *
 * All folded including the first: a template is a set of exercises rather than
 * an order to do them in, so opening one is a guess at where the owner starts.
 */
export function draftFromTemplate(
  group: WorkoutGroup,
  workouts: Workout[],
  startedAt: string = new Date().toISOString(),
): Draft {
  const entries = entriesFromTemplate(group, workouts);
  return {
    date: todayString(),
    name: group.name,
    entries,
    notes: '',
    collapsedIds: entries.map((e) => e.id),
    sourceGroupId: group.id,
    startedAt,
  };
}
