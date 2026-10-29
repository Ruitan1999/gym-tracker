import { prefersReducedMotion } from './motion';

/** The Home template list (WorkoutForm's group picker). Anchor for "Choose a different workout". */
export const TEMPLATE_LIST_ID = 'template-list';

/**
 * Bring the template list into view. Moves the scroll position and nothing
 * else — no state, no draft — so it is always safe to press.
 */
export function scrollToTemplateList(): void {
  const el = document.getElementById(TEMPLATE_LIST_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
}
