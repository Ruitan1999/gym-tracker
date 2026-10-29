import type { TrainingMode, Workout, WorkoutGroup } from '../types';
import { selectNextUp } from './nextUp';
import {
  draftFromTemplate,
  draftHasProgress,
  loadDraft,
  saveDraft,
  todayString,
  type StartOptions,
} from './templateSession';

/**
 * The template the Next Up card would be offering to start, or null.
 *
 * Reads the same selection as the card (`selectNextUp`) for the bottom nav's
 * Start button, which has to agree with the card without rendering it. A rest
 * day, an already-logged day and an empty list all give null.
 */
export function templateDueToday(
  groups: WorkoutGroup[],
  workouts: Workout[],
  day: number,
  today: string = todayString(),
  mode: TrainingMode = 'week',
): WorkoutGroup | null {
  const pick = selectNextUp(groups, workouts, mode, day, today);
  if (pick.kind === 'due') return pick.first;
  if (pick.kind === 'rotation') return pick.group;
  return null;
}

/**
 * Starting a template from the card. 'confirm' means a different template
 * already has real work in the draft and nothing was written, so the caller
 * asks first. Otherwise the draft is ready and the caller just opens the form.
 */
export function beginTemplate(
  group: WorkoutGroup,
  workouts: Workout[],
  options: StartOptions = {},
): 'confirm' | 'ready' {
  const existing = loadDraft();
  if (draftHasProgress(existing)) {
    // The same template, already underway, is reopened as it stands rather than
    // regenerated, which would reset the sets already logged.
    return existing?.sourceGroupId === group.id ? 'ready' : 'confirm';
  }
  saveDraft(draftFromTemplate(group, workouts, options));
  return 'ready';
}

/** Replace whatever is in the draft with this template, after the owner agreed. */
export function replaceDraftWith(
  group: WorkoutGroup,
  workouts: Workout[],
  options: StartOptions = {},
): void {
  saveDraft(draftFromTemplate(group, workouts, options));
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
  options: StartOptions = {},
): { autoOpenSelect: boolean } {
  if (draftHasProgress(loadDraft())) return { autoOpenSelect: false };
  if (due) {
    saveDraft(draftFromTemplate(due, workouts, options));
    return { autoOpenSelect: false };
  }
  return { autoOpenSelect: true };
}
