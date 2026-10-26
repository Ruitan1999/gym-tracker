/**
 * The template question that outlives the session it came from.
 *
 * Saving used to hold the workout back until this was answered, which made a
 * question about a template into the thing standing between a finished session
 * and being saved at all. It travels with the navigation now, so the session is
 * already in the book by the time it is asked, and any answer — including
 * walking away from it — leaves the session alone.
 */
export interface TemplateOffer {
  /** The line-up the session ended up with. */
  exerciseIds: string[];
  /** What to put in the name field, if the session was named. */
  defaultName?: string;
  /** Set when the session came from a template and drifted from it. */
  sourceGroupId?: string;
  sourceGroupName?: string;
}

/** Reads one back off a navigation, ignoring anything that isn't one. */
export function readTemplateOffer(state: unknown): TemplateOffer | null {
  if (!state || typeof state !== 'object') return null;
  const offer = (state as { offerTemplate?: unknown }).offerTemplate;
  if (!offer || typeof offer !== 'object') return null;
  const { exerciseIds } = offer as TemplateOffer;
  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) return null;
  return offer as TemplateOffer;
}
