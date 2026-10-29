import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { buildMuscleBalance } from '../../utils/muscleBalance';
import { BODY_PART_LABELS } from '../../utils/bodyParts';
import MuscleFigure from '../progress/MuscleFigure';
import { balancePaint } from '../progress/balancePaint';
import type { BodyPart } from '../../types';

/**
 * The body, shaded by sets worked in the last 30 days, with the sets per part
 * beside it. No controls: other windows and modes are on Progress.
 */
export default function HomeBalanceCard() {
  const { appData } = useAppContext();

  const sets = useMemo(
    () => buildMuscleBalance(appData.workouts, appData.exercises, '30d').sets,
    [appData.workouts, appData.exercises],
  );

  // Nothing logged yet means an all-grey figure, which says nothing.
  if (appData.workouts.length === 0) return null;

  const ranked = (Object.entries(sets) as [BodyPart, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const description = ranked.length
    ? `Sets worked in the last 30 days: ${ranked
        .map(([p, n]) => `${BODY_PART_LABELS[p].toLowerCase()} ${n} sets`)
        .join(', ')}`
    : 'Nothing trained in the last 30 days';

  return (
    <section className="card mb-4 p-4" aria-label="Muscle groups">
      <h2 className="caps-tight text-[11px] mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Muscle groups · last 30 days
      </h2>
      <div className="flex flex-wrap items-start gap-4">
        <MuscleFigure paint={balancePaint(sets)} description={description} />
        {/* The same numbers as words, most-trained first. */}
        <div className="flex-1 min-w-[136px]" aria-hidden>
          {ranked.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              No sets logged in the last 30 days.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {ranked.map(([part, n]) => (
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
                    {n} {n === 1 ? 'set' : 'sets'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
