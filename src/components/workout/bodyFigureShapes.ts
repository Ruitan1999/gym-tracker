import type { BodyPart } from '../../types';

/**
 * Which MuscleMap outline slugs (see src/data/bodyPaths.ts) belong to each of
 * our coarse body parts. The one place the two vocabularies meet: a slug can
 * appear on the front view, the back view or both, and a part simply lights
 * every slug it owns that the view has.
 *
 * Cardio works no muscle outline, so it owns nothing. Anything in the data
 * that no part owns (head, hair, hands, feet, knees, ankles) is the quiet
 * base of the figure and is never lit.
 */
export const PART_SLUGS: Record<BodyPart, readonly string[]> = {
  chest: ['chest'],
  back: ['trapezius', 'upperBack', 'lowerBack', 'rhomboids', 'rotatorCuff'],
  shoulders: ['deltoids'],
  arms: ['biceps', 'triceps'],
  forearms: ['forearm'],
  core: ['abs', 'obliques', 'serratus'],
  legs: ['quadriceps', 'hamstring', 'gluteal', 'adductors', 'hipFlexors'],
  calves: ['calves', 'tibialis'],
  neck: ['neck'],
  cardio: [],
};

const SLUG_PART = new Map<string, BodyPart>(
  (Object.entries(PART_SLUGS) as [BodyPart, readonly string[]][]).flatMap(([part, slugs]) =>
    slugs.map((slug) => [slug, part] as const),
  ),
);

/** The body part a slug lights with, or undefined for the quiet base. */
export function partOfSlug(slug: string): BodyPart | undefined {
  return SLUG_PART.get(slug);
}
