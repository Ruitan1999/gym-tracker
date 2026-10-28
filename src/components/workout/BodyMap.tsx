import type { BodyPart } from '../../types';
import { BODY_PART_LABELS } from '../../utils/bodyParts';
import BodyFigure from './BodyFigure';
import { BACK, FRONT, type Shape } from './bodyFigureShapes';

const FIGURE_W = 84;

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
      <BodyFigure
        regions={regions}
        width={FIGURE_W}
        label={`${label} view`}
        paint={(part) => {
          const sets = worked[part] ?? 0;
          // Everything worked stays clearly lit; the shading only ranks it.
          return sets > 0
            ? { fill: 'var(--color-volt)', opacity: 0.45 + 0.55 * (sets / hardest) }
            : { fill: 'var(--color-line-2)', opacity: 0.55 };
        }}
      />
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
