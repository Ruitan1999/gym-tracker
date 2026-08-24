import { useAppContext } from '../../context/AppContext';
import { imageForExercise } from '../../utils/exerciseImage';

/** Enough to recognise something at a glance without becoming a list. */
const DEFAULT_MAX = 5;
const SIZE = 30;

/**
 * The pictures of the exercises something holds, as a strip.
 *
 * Neither a template nor a logged session has a picture of its own, but its
 * exercises do, and the line-up is what actually distinguishes one from
 * another — "Push Day A" and "Push Day B" read identically as text, and so do
 * two Tuesdays.
 *
 * Only exercises that have a picture are drawn: a row of empty grey squares
 * says nothing, so a template whose exercises have none renders nothing at all
 * and the card looks as it did before.
 */
export default function ExerciseStrip({
  exerciseIds,
  max = DEFAULT_MAX,
}: {
  exerciseIds: string[];
  /** Raise it where the strip has a row to itself rather than sharing one. */
  max?: number;
}) {
  const { exerciseImages } = useAppContext();

  const pictures: string[] = [];
  for (const id of exerciseIds) {
    const src = imageForExercise(id, exerciseImages);
    if (src) pictures.push(src);
    if (pictures.length === max) break;
  }
  if (pictures.length === 0) return null;

  // Counts every exercise not pictured here, not just the ones with pictures —
  // "+2" means two more exercises, which is what the number is read as.
  const remaining = exerciseIds.length - pictures.length;

  // The row it sits in can be narrower than the thumbnails want — beside a
  // menu column, say. The pictures clip rather than spilling over whatever is
  // next to them, and the +N is a sibling so it survives the clipping.
  return (
    <span className="flex items-center gap-1.5 min-w-0" aria-hidden>
      <span className="flex items-center gap-1.5 min-w-0 overflow-hidden">
      {pictures.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          width={SIZE}
          height={SIZE}
          className="shrink-0"
          style={{
            width: SIZE,
            height: SIZE,
            objectFit: 'cover',
            borderRadius: 'var(--radius)',
            background: 'var(--color-line-2)',
          }}
        />
      ))}
      </span>
      {remaining > 0 && (
        <span
          className="caps-tight text-[9px] shrink-0 pl-0.5"
          style={{ color: 'var(--color-text-faint)' }}
        >
          +{remaining}
        </span>
      )}
    </span>
  );
}
