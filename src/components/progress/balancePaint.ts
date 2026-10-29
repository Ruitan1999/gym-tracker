import type { BodyPart } from '../../types';
import type { PartPaint } from '../workout/BodyFigure';

export const IDLE_PAINT: PartPaint = { fill: 'var(--color-line-2)', opacity: 0.55 };

/**
 * Shading for "sets worked": the most-trained part at full strength, the rest
 * in proportion, untrained parts left grey. Shared by the Progress card and
 * the one on Home so the two always agree.
 */
export function balancePaint(sets: Partial<Record<BodyPart, number>>): (part: BodyPart) => PartPaint {
  const hardest = Math.max(1, ...Object.values(sets).map((n) => n ?? 0));
  return (part) => {
    const n = sets[part] ?? 0;
    return n > 0 ? { fill: 'var(--color-volt)', opacity: 0.35 + 0.65 * (n / hardest) } : IDLE_PAINT;
  };
}
