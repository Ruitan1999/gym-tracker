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
 * The body, shaded by sets worked over the last month or quarter. Only the
 * picture and the window: the modes and the per-part list stay on Progress.
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

  const worked = (Object.entries(sets) as [BodyPart, number][])
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([p, n]) => `${BODY_PART_LABELS[p].toLowerCase()} ${n} sets`);
  const description = worked.length
    ? `Sets worked in the last ${window === '30d' ? '30' : '90'} days: ${worked.join(', ')}`
    : `Nothing trained in the last ${window === '30d' ? '30' : '90'} days`;

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
      <div className="flex justify-center">
        <MuscleFigure paint={balancePaint(sets)} description={description} />
      </div>
    </section>
  );
}
