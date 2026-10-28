import type { BodyPart } from '../../types';

interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  rx: number;
}

/**
 * The Progress card needs to light up the parts that were NOT trained, and to
 * show the figure when nothing was trained at all. The session figure on the
 * saved-workout page does neither, so this is a small figure of its own: the
 * same blocky idea, coarse body parts only.
 */
const VIEW_W = 100;
const VIEW_H = 170;

const ARMS: Shape[] = [
  { x: 14, y: 40, w: 13, h: 28, rx: 4 },
  { x: 73, y: 40, w: 13, h: 28, rx: 4 },
];
const FOREARMS: Shape[] = [
  { x: 13, y: 70, w: 12, h: 28, rx: 4 },
  { x: 75, y: 70, w: 12, h: 28, rx: 4 },
];
const SHOULDERS: Shape[] = [
  { x: 18, y: 28, w: 17, h: 11, rx: 4 },
  { x: 65, y: 28, w: 17, h: 11, rx: 4 },
];
const LEGS: Shape[] = [
  { x: 33, y: 96, w: 16, h: 38, rx: 5 },
  { x: 51, y: 96, w: 16, h: 38, rx: 5 },
];
const CALVES: Shape[] = [
  { x: 34, y: 136, w: 14, h: 30, rx: 5 },
  { x: 52, y: 136, w: 14, h: 30, rx: 5 },
];
const NECK: Shape[] = [{ x: 45, y: 22, w: 10, h: 6, rx: 2 }];
const CHEST: Shape[] = [{ x: 36, y: 29, w: 28, h: 22, rx: 4 }];
const CORE: Shape[] = [{ x: 38, y: 53, w: 24, h: 26, rx: 4 }];
const TRUNK_BACK: Shape[] = [{ x: 36, y: 29, w: 28, h: 50, rx: 5 }];

/** Head and hips belong to no muscle group, so they never light up. */
const INERT: Shape[] = [
  { x: 40, y: 2, w: 20, h: 18, rx: 6 },
  { x: 36, y: 81, w: 28, h: 13, rx: 4 },
];

const FRONT: Partial<Record<BodyPart, Shape[]>> = {
  neck: NECK,
  shoulders: SHOULDERS,
  chest: CHEST,
  core: CORE,
  arms: ARMS,
  forearms: FOREARMS,
  legs: LEGS,
  calves: CALVES,
};

const BACK: Partial<Record<BodyPart, Shape[]>> = {
  neck: NECK,
  shoulders: SHOULDERS,
  back: TRUNK_BACK,
  arms: ARMS,
  forearms: FOREARMS,
  legs: LEGS,
  calves: CALVES,
};

export interface PartPaint {
  fill: string;
  opacity: number;
}

function Side({
  regions,
  label,
  paint,
}: {
  regions: Partial<Record<BodyPart, Shape[]>>;
  label: string;
  paint: (part: BodyPart) => PartPaint;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={96}
        height={Math.round((96 * VIEW_H) / VIEW_W)}
        aria-hidden
      >
        {INERT.map((s, i) => (
          <rect
            key={i}
            x={s.x}
            y={s.y}
            width={s.w}
            height={s.h}
            rx={s.rx}
            fill="var(--color-line-2)"
            opacity={0.45}
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
      <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </span>
    </div>
  );
}

export default function MuscleFigure({
  paint,
  description,
}: {
  paint: (part: BodyPart) => PartPaint;
  description: string;
}) {
  return (
    <div className="flex gap-2 shrink-0" role="img" aria-label={description}>
      <Side regions={FRONT} label="FRONT" paint={paint} />
      <Side regions={BACK} label="BACK" paint={paint} />
    </div>
  );
}
