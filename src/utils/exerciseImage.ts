import { OWN_EXERCISE_IMAGE_IDS } from '../data/exerciseImages';

/**
 * Where an exercise's picture lives, or null for the ones without.
 *
 * The files are named by exercise id, so this is a rule rather than a table —
 * a lookup of 1,300 entries would ride along in the bundle for the sake of
 * something the filename already says.
 *
 * Images are © Gym visual (https://gymvisual.com/) and carry their own terms;
 * the attribution has to travel with them wherever they are shown.
 */
export function exerciseImageUrl(id: string): string | null {
  if (id.startsWith('ex-gv-') || OWN_EXERCISE_IMAGE_IDS.has(id)) {
    return `/exercise-images/${id}.jpg`;
  }
  return null;
}

export const MEDIA_ATTRIBUTION = '© Gym visual — gymvisual.com';
