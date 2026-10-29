import type { BodyPart } from '../../types';
import { BODY_PART_LABELS } from '../../utils/bodyParts';
import BodyFigure from './BodyFigure';
import { BODY_VIEWS } from '../../data/bodyPaths';

const HEIGHT = 36;
// Same proportions as the full figure, so the two read as one drawing.
const [, , VIEW_W, VIEW_H] = BODY_VIEWS.front.viewBox;
const WIDTH = (HEIGHT * VIEW_W) / VIEW_H;

/**
 * Front and back figure at a glance: the regions a session works are lit,
 * everything else is dim. No labels and no shading by amount — at this size it
 * is only there to say "this is Leg Day" before the card is opened.
 *
 * Renders nothing when there is nothing to light, so a session with no
 * exercises yet does not show a blank figure.
 */
export default function MiniBodyMap({ parts }: { parts: BodyPart[] }) {
  if (parts.length === 0) return null;

  const lit = new Set(parts);
  const paint = (part: BodyPart) =>
    lit.has(part)
      ? { fill: 'var(--color-volt)', opacity: 1 }
      : { fill: 'var(--color-line-3)', opacity: 0.5 };

  return (
    <span
      role="img"
      aria-label={`Works ${parts.map((p) => BODY_PART_LABELS[p].toLowerCase()).join(', ')}`}
      className="flex items-center shrink-0"
      style={{ gap: 3 }}
    >
      <BodyFigure side="front" paint={paint} width={WIDTH} />
      <BodyFigure side="back" paint={paint} width={WIDTH} />
    </span>
  );
}
