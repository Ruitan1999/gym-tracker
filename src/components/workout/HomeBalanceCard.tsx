import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { buildMuscleBalance } from '../../utils/muscleBalance';
import { BODY_PART_LABELS } from '../../utils/bodyParts';
import Segmented from '../progress/Segmented';
import MuscleFigure from '../progress/MuscleFigure';
import { balancePaint } from '../progress/balancePaint';
import type { BodyPart } from '../../types';

type Window = '30d' | '90d';

const OPTIONS: { value: Window; label: string }[] = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
];

/**
 * The body, shaded by sets worked over the last month or quarter, with the
 * sets per part beside it. Only the window to choose: the other modes stay on
 * Progress.
 */
export default function HomeBalanceCard() {
  const { appData } = useAppContext();
  const [window, setWindow] = useState<Window>('30d');

  const sets = useMemo(
    () => buildMuscleBalance(appData.workouts, appData.exercises, window).sets,
    [appData.workouts, appData.exercises, window],
  );

  // Nothing logged yet means an all-grey figure, which says nothing.
  if (appData.workouts.length === 0) return null;

  const days = window === '30d' ? '30' : '90';
  const ranked = (Object.entries(sets) as [BodyPart, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const description = ranked.length
    ? `Sets worked in the last ${days} days: ${ranked
        .map(([p, n]) => `${BODY_PART_LABELS[p].toLowerCase()} ${n} sets`)
        .join(', ')}`
    : `Nothing trained in the last ${days} days`;

  return (
    <section className="card mb-4 p-4" aria-label="Muscle balance">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="caps-tight text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
          Muscle balance
        </h2>
        <div className="w-40">
          <Segmented label="Window" options={OPTIONS} value={window} onChange={setWindow} />
        </div>
      </div>
      <div className="flex items-start gap-4">
        <MuscleFigure paint={balancePaint(sets)} description={description} />
        {/* The same numbers as words, most-trained first. */}
        <div className="flex-1 min-w-0" aria-hidden>
          <div className="caps-tight text-[9px] mb-2" style={{ color: 'var(--color-text-faint)' }}>
            SETS · THE LAST {days} DAYS
          </div>
          {ranked.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              No sets logged in this period.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {ranked.map(([part, n]) => (
                <li key={part} className="flex items-baseline gap-2">
                  <span
                    className="caps-tight text-[10px] flex-1 min-w-0 truncate"
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
