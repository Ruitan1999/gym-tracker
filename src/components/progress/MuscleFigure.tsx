import type { BodyPart } from '../../types';
import BodyFigure, { type BodySide, type PartPaint } from '../workout/BodyFigure';

export type { PartPaint };

function Side({
  side,
  label,
  paint,
}: {
  side: BodySide;
  label: string;
  paint: (part: BodyPart) => PartPaint;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <BodyFigure side={side} paint={paint} width={96} />
      <span className="caps-tight text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </span>
    </div>
  );
}

/**
 * The Progress card needs to light up the parts that were NOT trained, and to
 * show the figure when nothing was trained at all, so its paint is the
 * caller's; the drawing is the one the session pages use.
 */
export default function MuscleFigure({
  paint,
  description,
}: {
  paint: (part: BodyPart) => PartPaint;
  description: string;
}) {
  return (
    <div className="flex gap-2 shrink-0" role="img" aria-label={description}>
      <Side side="front" label="FRONT" paint={paint} />
      <Side side="back" label="BACK" paint={paint} />
    </div>
  );
}
