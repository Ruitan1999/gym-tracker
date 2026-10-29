import type { BodyPart } from '../../types';
import type { PartPaint } from '../workout/BodyFigure';
import { NOT_A_MUSCLE } from '../../utils/muscleBalance';

export const IDLE_PAINT: PartPaint = { fill: 'var(--color-line-2)', opacity: 0.55 };

/**
 * Shading for "sets worked": the most-trained part at full strength, the rest
 * in proportion, untrained parts left grey. Shared by the Stats card and
 * the one on Home so the two always agree.
 */
export function balancePaint(sets: Partial<Record<BodyPart, number>>): (part: BodyPart) => PartPaint {
  // Cardio is not on the figure, so it must not set the scale for what is.
  const hardest = Math.max(
    1,
    ...Object.entries(sets)
      .filter(([part]) => !NOT_A_MUSCLE.includes(part as BodyPart))
      .map(([, n]) => n ?? 0),
  );
  return (part) => {
    const n = sets[part] ?? 0;
    return n > 0 ? { fill: 'var(--color-volt)', opacity: 0.35 + 0.65 * (n / hardest) } : IDLE_PAINT;
  };
}
