import type { BodyPart } from '../../types';
import { INERT, VIEW_H, VIEW_W, type Shape } from './bodyFigureShapes';

export interface PartPaint {
  fill: string;
  opacity: number;
}

/**
 * One side of the figure, drawn from the shared shapes. Sized outright by the
 * caller: a percentage width inside a shrink-to-fit column resolves against a
 * column that is itself sized by this svg, and collapses to nothing.
 */
export default function BodyFigure({
  regions,
  paint,
  width,
  label,
}: {
  regions: Partial<Record<BodyPart, Shape[]>>;
  paint: (part: BodyPart) => PartPaint;
  width: number;
  /** Omit to hide the drawing from assistive tech (the caller labels it). */
  label?: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width={width}
      height={Math.round((width * VIEW_H) / VIEW_W)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {INERT.map((s, i) => (
        <rect
          key={`i${i}`}
          x={s.x}
          y={s.y}
          width={s.w}
          height={s.h}
          rx={s.rx}
          fill="var(--color-line-2)"
          opacity={0.55}
        />
      ))}
      {(Object.keys(regions) as BodyPart[]).map((part) => {
        const p = paint(part);
        return regions[part]!.map((s, i) => (
          <rect
            key={`${part}${i}`}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={s.rx}
            fill={p.fill}
            opacity={p.opacity}
          />
        ));
      })}
    </svg>
  );
}
