import type { TrainingMode, UserPreferences, Workout, WorkoutGroup } from '../types';

/**
 * Rotation mode: templates take turns in the order they are listed, and "next"
 * is whichever follows the one trained last, however the week went.
 *
 * Saved workouts do not record which template they came from, and the save
 * flow is not to change for this, so the last-trained template is inferred
 * from what was saved.
 */

/** Absent means 'week', which is every account that predates the setting. */
export function trainingModeOf(
  preferences: Pick<UserPreferences, 'trainingMode'> | undefined,
): TrainingMode {
  return preferences?.trainingMode === 'rotation' ? 'rotation' : 'week';
}

const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase();

/** Most recent first: by date, then by when it was saved. */
function newestFirst(a: Workout, b: Workout): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  const ta = new Date(a.createdAt).getTime() || 0;
  const tb = new Date(b.createdAt).getTime() || 0;
  return tb - ta;
}

function sameExerciseSet(workout: Workout, group: WorkoutGroup): boolean {
  const w = new Set(workout.entries.map((e) => e.exerciseId));
  const g = new Set(group.exerciseIds);
  if (w.size === 0 || w.size !== g.size) return false;
  for (const id of w) if (!g.has(id)) return false;
  return true;
}

/**
 * The index in `groups` of the template a workout most plausibly came from:
 * by name first (case-insensitive, trimmed), otherwise by an identical set of
 * exercises. Two templates sharing a name cannot be told apart, so the first
 * listed wins.
 */
export function templateIndexForWorkout(workout: Workout, groups: WorkoutGroup[]): number {
  const name = norm(workout.name);
  if (name) {
    const byName = groups.findIndex((g) => norm(g.name) === name);
    if (byName >= 0) return byName;
  }
  return groups.findIndex((g) => sameExerciseSet(workout, g));
}

/** Index of the template trained most recently, or -1 when none can be matched. */
export function lastTrainedIndex(groups: WorkoutGroup[], workouts: Workout[]): number {
  if (groups.length === 0) return -1;
  for (const w of [...workouts].sort(newestFirst)) {
    const i = templateIndexForWorkout(w, groups);
    if (i >= 0) return i;
  }
  return -1;
}

/**
 * The template that is next in the rotation: the one after the last trained,
 * wrapping round; the first when nothing has been trained from a template.
 */
export function nextInRotation(groups: WorkoutGroup[], workouts: Workout[]): WorkoutGroup | null {
  if (groups.length === 0) return null;
  const last = lastTrainedIndex(groups, workouts);
  return groups[(last + 1) % groups.length];
}
