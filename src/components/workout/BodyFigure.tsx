import type { BodyPart } from '../../types';
import { BODY_VIEWS } from '../../data/bodyPaths';
import { partOfSlug } from './bodyFigureShapes';

export interface PartPaint {
  fill: string;
  opacity: number;
}

export type BodySide = 'front' | 'back';

/** The quiet base: head, hands, feet and joints, never lit. */
const BASE: PartPaint = { fill: 'var(--color-line-2)', opacity: 0.7 };

/**
 * One side of the figure. Every outline is drawn once; the ones that belong to
 * a body part take that part's paint, the rest stay the quiet base. Sized
 * outright by the caller: a percentage width inside a shrink-to-fit column
 * resolves against a column that is itself sized by this svg, and collapses to
 * nothing.
 */
export default function BodyFigure({
  side,
  paint,
  width,
  label,
}: {
  side: BodySide;
  paint: (part: BodyPart) => PartPaint;
  width: number;
  /** Omit to hide the drawing from assistive tech (the caller labels it). */
  label?: string;
}) {
  const { viewBox, paths } = BODY_VIEWS[side];
  const [, , vw, vh] = viewBox;
  return (
    <svg
      viewBox={viewBox.join(' ')}
      width={width}
      height={Math.round((width * vh) / vw)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {Object.entries(paths).map(([slug, d]) => {
        const part = partOfSlug(slug);
        const p = part ? paint(part) : BASE;
        return (
          <path
            key={slug}
            d={d}
            data-slug={slug}
            data-part={part}
            fill={p.fill}
            opacity={p.opacity}
          />
        );
      })}
    </svg>
  );
}
