import type { BodyPart } from '../../types';
import { BODY_PART_LABELS } from '../../utils/bodyParts';

interface Shape {
  x: number;
  y: number;
  w: number;
  h: number;
  rx?: number;
}

/**
 * A blocky figure rather than an anatomical one. At the size this renders it
 * would be a smudge either way, and squared-off slabs sit with the rest of the
 * app better than a traced silhouette would.
 */
const VIEW_W = 120;
const VIEW_H = 190;
const FIGURE_W = 84;

const ARMS: Shape[] = [
  { x: 26, y: 48, w: 13, h: 26, rx: 4 },
  { x: 81, y: 48, w: 13, h: 26, rx: 4 },
];
const FOREARMS: Shape[] = [
  { x: 26, y: 76, w: 12, h: 26, rx: 4 },
  { x: 82, y: 76, w: 12, h: 26, rx: 4 },
];
const SHOULDERS: Shape[] = [
  { x: 28, y: 34, w: 16, h: 12, rx: 3 },
  { x: 76, y: 34, w: 16, h: 12, rx: 3 },
];
const LEGS: Shape[] = [
  { x: 45, y: 100, w: 14, h: 42, rx: 4 },
  { x: 61, y: 100, w: 14, h: 42, rx: 4 },
];
const CALVES: Shape[] = [
  { x: 46, y: 144, w: 12, h: 38, rx: 4 },
  { x: 62, y: 144, w: 12, h: 38, rx: 4 },
];
const NECK: Shape[] = [{ x: 55, y: 27, w: 10, h: 6, rx: 2 }];
const UPPER_TORSO: Shape = { x: 44, y: 34, w: 32, h: 22, rx: 3 };
const LOWER_TORSO: Shape = { x: 46, y: 58, w: 28, h: 26, rx: 3 };

/** Head and hips belong to no muscle group, so they never light up. */
const INERT: Shape[] = [
  { x: 50, y: 4, w: 20, h: 20, rx: 5 },
  { x: 44, y: 86, w: 32, h: 12, rx: 3 },
];

const FRONT: Partial<Record<BodyPart, Shape[]>> = {
  neck: NECK,
  shoulders: SHOULDERS,
  chest: [UPPER_TORSO],
  core: [LOWER_TORSO],
  arms: ARMS,
  forearms: FOREARMS,
  legs: LEGS,
  calves: CALVES,
};

// From behind there is no chest and no abdomen: the whole trunk is back.
const BACK: Partial<Record<BodyPart, Shape[]>> = {
  neck: NECK,
  shoulders: SHOULDERS,
  back: [UPPER_TORSO, LOWER_TORSO],
  arms: ARMS,
  forearms: FOREARMS,
  legs: LEGS,
  calves: CALVES,
};

function Figure({
  regions,
  label,
  worked,
  hardest,
}: {
  regions: Partial<Record<BodyPart, Shape[]>>;
  label: string;
  worked: Partial<Record<BodyPart, number>>;
  hardest: number;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Sized outright: a percentage width inside a shrink-to-fit column
          resolves against a column that is itself sized by this svg, and
          collapses to nothing. */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width={FIGURE_W}
        height={Math.round((FIGURE_W * VIEW_H) / VIEW_W)}
        role="img"
        aria-label={`${label} view`}
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
        {(Object.keys(regions) as BodyPart[]).map((part) =>
          regions[part]!.map((s, i) => {
            const sets = worked[part] ?? 0;
            // Everything worked stays clearly lit; the shading only ranks it.
            const strength = sets > 0 ? 0.45 + 0.55 * (sets / hardest) : 0;
            return (
              <rect
                key={`${part}${i}`}
                x={s.x}
                y={s.y}
                width={s.w}
                height={s.h}
                rx={s.rx}
                fill={sets > 0 ? 'var(--color-volt)' : 'var(--color-line-2)'}
                opacity={sets > 0 ? strength : 0.55}
              />
            );
          }),
        )}
      </svg>
      <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </span>
    </div>
  );
}

export default function BodyMap({ worked }: { worked: Partial<Record<BodyPart, number>> }) {
  const entries = (Object.entries(worked) as [BodyPart, number][])
    .filter(([, sets]) => sets > 0)
    .sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) return null;

  const hardest = Math.max(...entries.map(([, sets]) => sets));

  return (
    <section className="card p-4">
      <div className="caps-tight text-[9px] mb-3" style={{ color: 'var(--color-text-faint)' }}>
        WORKED THIS SESSION
      </div>
      <div className="flex items-start gap-4">
        <div className="flex gap-2 shrink-0">
          <Figure regions={FRONT} label="FRONT" worked={worked} hardest={hardest} />
          <Figure regions={BACK} label="BACK" worked={worked} hardest={hardest} />
        </div>
        <ul className="flex-1 min-w-0 flex flex-col gap-1.5">
          {entries.map(([part, sets]) => (
            <li key={part} className="flex items-center gap-2">
              <span
                aria-hidden
                className="shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 1,
                  background: 'var(--color-volt)',
                  opacity: 0.45 + 0.55 * (sets / hardest),
                }}
              />
              <span
                className="caps-tight text-[9px] flex-1 min-w-0 truncate"
                style={{ color: 'var(--color-text)' }}
              >
                {BODY_PART_LABELS[part]}
              </span>
              <span
                className="font-mono text-[11px]"
                style={{
                  color: 'var(--color-text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {sets}
              </span>
              <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
                {sets === 1 ? 'SET' : 'SETS'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
