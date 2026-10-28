import type { TrainingMode, Workout, WorkoutGroup } from '../types';
import { hasAnySchedule, nextUpcoming, templatesOn, type UpcomingTemplate } from './schedule';
import { nextInRotation } from './rotation';

/**
 * What the home screen should be offering right now.
 *
 * One function decides this, and both the Next Up card and the bottom nav's
 * Start button read it, so the two cannot drift apart: the button used to carry
 * a copy of the card's rules, and a copy is only right until the next change.
 */
export type NextUp =
  /** No templates at all: nothing to suggest. */
  | { kind: 'none' }
  /** Already trained today; the card steps back and points at what is next. */
  | {
      kind: 'done';
      workout: Workout;
      upcoming: UpcomingTemplate | null;
      /** Rotation mode only: the template that is next in the rotation. */
      rotationNext: WorkoutGroup | null;
    }
  /** Week mode: something is scheduled for today. */
  | { kind: 'due'; first: WorkoutGroup; alsoToday: WorkoutGroup[] }
  /** Rotation mode: the next template in order. */
  | { kind: 'rotation'; group: WorkoutGroup }
  /** Week mode: nothing today, but something later in the week. */
  | { kind: 'upcoming'; upcoming: UpcomingTemplate }
  /** Week mode: templates exist but none has a weekday. */
  | { kind: 'unscheduled' };

/** The session logged today, latest saved first, if there is one. */
function loggedOn(workouts: Workout[], today: string): Workout | undefined {
  return workouts
    .filter((w) => w.date === today)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

export function selectNextUp(
  groups: WorkoutGroup[],
  workouts: Workout[],
  mode: TrainingMode,
  day: number,
  today: string,
): NextUp {
  if (groups.length === 0) return { kind: 'none' };

  const logged = loggedOn(workouts, today);
  if (logged) {
    return {
      kind: 'done',
      workout: logged,
      upcoming: mode === 'week' ? nextUpcoming(groups, day) : null,
      // Worked out including today's session, so it is the one after the one just done.
      rotationNext: mode === 'rotation' ? nextInRotation(groups, workouts) : null,
    };
  }

  if (mode === 'rotation') {
    const group = nextInRotation(groups, workouts);
    return group ? { kind: 'rotation', group } : { kind: 'none' };
  }

  const [first, ...alsoToday] = templatesOn(groups, day);
  if (first) return { kind: 'due', first, alsoToday };
  const upcoming = nextUpcoming(groups, day);
  if (upcoming) return { kind: 'upcoming', upcoming };
  return hasAnySchedule(groups) ? { kind: 'none' } : { kind: 'unscheduled' };
}
