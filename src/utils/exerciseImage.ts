import { OWN_EXERCISE_IMAGES } from '../data/exerciseImages';

/**
 * Where an exercise's picture lives, or null for the ones without.
 *
 * Imported exercises are found by convention — the file is named after the id —
 * so 1,300 of them cost nothing to look up. Everything else, including anything
 * an admin has added or replaced, is listed by name so any image format works.
 *
 * Images from the upstream dataset are © Gym visual (https://gymvisual.com/)
 * and carry their own terms; the attribution has to travel with them.
 */
export function exerciseImageUrl(id: string): string | null {
  const named = OWN_EXERCISE_IMAGES[id];
  if (named) return `/assets/exercise-images/${named}`;
  if (id.startsWith('ex-gv-')) return `/assets/exercise-images/${id}.webp`;
  return null;
}

/**
 * The same question, but honouring a picture an admin has set for everyone.
 * Components have the map to hand from the app context.
 */
export function imageForExercise(
  id: string,
  adminImages: Record<string, string>,
): string | null {
  return adminImages[id] ?? exerciseImageUrl(id);
}

export const MEDIA_ATTRIBUTION = '© Gym visual — gymvisual.com';
