import type { Workout, WorkoutGroup } from '../types';
import { templatesOn } from './schedule';
import { draftFromTemplate, draftHasProgress, loadDraft, saveDraft, todayString } from './templateSession';

/**
 * The template the Next Up card would be offering as due today, or null.
 *
 * Mirrors NextUpCard's own choice (first template on today's weekday, and
 * nothing once a session is already logged today) for the bottom nav's Start
 * button, which has to agree with the card without rendering it.
 */
export function templateDueToday(
  groups: WorkoutGroup[],
  workouts: Workout[],
  day: number,
  today: string = todayString(),
): WorkoutGroup | null {
  if (workouts.some((w) => w.date === today)) return null;
  return templatesOn(groups, day)[0] ?? null;
}

/**
 * What pressing Start should do, after getting the draft ready.
 *
 * - A session with real work already in the draft is resumed as it stands;
 *   nothing is written, so nothing can be overwritten.
 * - Otherwise today's template is turned into a fresh draft and opened.
 * - With no template due, the form opens on the exercise picker.
 */
export function prepareStart(
  due: WorkoutGroup | null,
  workouts: Workout[],
): { autoOpenSelect: boolean } {
  if (draftHasProgress(loadDraft())) return { autoOpenSelect: false };
  if (due) {
    saveDraft(draftFromTemplate(due, workouts));
    return { autoOpenSelect: false };
  }
  return { autoOpenSelect: true };
}
