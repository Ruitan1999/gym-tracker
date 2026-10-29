import type { AppData } from '../types';

/** Everything in `mine`, then whatever `theirs` has that `mine` doesn't, by id. */
function unionById<T extends { id: string }>(mine: T[], theirs: T[]): T[] {
  const have = new Set(mine.map((x) => x.id));
  return [...mine, ...theirs.filter((x) => !have.has(x.id))];
}

/**
 * The account's data with what was done on this phone while it loaded laid
 * on top. Nothing the account has is dropped: a workout, template or exercise
 * missing from the phone's copy is kept from the account's; where both have
 * the same one, the phone's version wins, since it is the newer. So pushing
 * the result can never wipe the account, even when the phone started from an
 * empty or stale copy.
 */
export function mergeAppData(phone: AppData, account: AppData): AppData {
  return {
    ...account,
    workouts: unionById(phone.workouts, account.workouts),
    groups: unionById(phone.groups ?? [], account.groups ?? []),
    exercises: unionById(phone.exercises, account.exercises),
    preferences: phone.preferences,
    deletedExerciseIds: [
      ...new Set([...(phone.deletedExerciseIds ?? []), ...(account.deletedExerciseIds ?? [])]),
    ],
    renamedExerciseIds: [
      ...new Set([...(phone.renamedExerciseIds ?? []), ...(account.renamedExerciseIds ?? [])]),
    ],
    exerciseImages: { ...(account.exerciseImages ?? {}), ...(phone.exerciseImages ?? {}) },
    dataVersion: Math.max(phone.dataVersion ?? 1, account.dataVersion ?? 1),
  };
}
