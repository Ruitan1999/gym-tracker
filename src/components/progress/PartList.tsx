import type { BodyPart } from '../../types';
import { BODY_PART_LABELS } from '../../utils/bodyParts';

/** The body parts beside a figure, each with a short note, in the order given. */
export default function PartList({
  rows,
  empty,
}: {
  rows: { part: BodyPart; note: string }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
        {empty}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map(({ part, note }) => (
        <li key={part} className="flex items-baseline gap-2">
          <span
            className="caps-tight text-[11px] flex-1 min-w-0 truncate"
            style={{ color: 'var(--color-text)' }}
          >
            {BODY_PART_LABELS[part]}
          </span>
          <span
            className="font-mono text-[11px] shrink-0"
            style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}
          >
            {note}
          </span>
        </li>
      ))}
    </ul>
  );
}
