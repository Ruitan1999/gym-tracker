import type { AppData } from '../types';

/**
 * The exercises this account is actually going to look at.
 *
 * The library ships over 1,400 pictures and fetching them all would be several
 * megabytes for the handful anybody sees. What a given account sees is a much
 * smaller set: the exercises in its templates, and the ones it has logged
 * lately. Warming those once at startup means every list afterwards draws from
 * cache instead of going to the network the first time it scrolls into view.
 *
 * Templates come first because they are on the home screen, then recent
 * sessions, most recent first.
 */
export function usedExerciseIds(
  appData: Pick<AppData, 'groups' | 'workouts'>,
  recentSessions = 25,
): string[] {
  const ids = new Set<string>();

  for (const group of appData.groups ?? []) {
    for (const id of group.exerciseIds ?? []) ids.add(id);
  }

  const recent = [...(appData.workouts ?? [])]
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    .slice(0, recentSessions);

  for (const workout of recent) {
    for (const entry of workout.entries ?? []) ids.add(entry.exerciseId);
  }

  return [...ids];
}
