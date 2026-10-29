import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { buildMuscleBalance, NOT_A_MUSCLE, rankedSets, setCount } from '../../utils/muscleBalance';
import { BODY_PART_LABELS } from '../../utils/bodyParts';
import { todayString } from '../../utils/templateSession';
import MuscleFigure from '../progress/MuscleFigure';
import PartList from '../progress/PartList';
import { balancePaint } from '../progress/balancePaint';

/**
 * The body, shaded by sets worked in the last 30 days, with the sets per part
 * beside it. No controls: other windows and modes are on Stats.
 */
export default function HomeBalanceCard() {
  const { appData } = useAppContext();
  // Part of the key so a phone left open past midnight moves the window on.
  const today = todayString();

  const view = useMemo(() => {
    const sets = buildMuscleBalance(appData.workouts, appData.exercises, '30d').sets;
    // Cardio has no region on the figure, so it is left out of this picture.
    const ranked = rankedSets(sets).filter(([part]) => !NOT_A_MUSCLE.includes(part));
    return {
      paint: balancePaint(sets),
      rows: ranked.map(([part, n]) => ({ part, note: setCount(n) })),
      description: ranked.length
        ? `Sets worked in the last 30 days: ${ranked
            .map(([p, n]) => `${BODY_PART_LABELS[p].toLowerCase()} ${setCount(n)}`)
            .join(', ')}`
        : 'Nothing trained in the last 30 days',
    };
    // today is a dependency on purpose: the 30 days move with the date.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData.workouts, appData.exercises, today]);

  // Nothing in the last 30 days means an all-grey figure, which says nothing.
  if (view.rows.length === 0) return null;

  return (
    <section className="card mb-4 p-4" aria-label="Muscle groups">
      <h2 className="caps-tight mb-3" style={{ color: 'var(--color-text-muted)' }}>
        Muscle groups · last 30 days
      </h2>
      <div className="flex flex-wrap justify-center items-start gap-4">
        <MuscleFigure paint={view.paint} description={view.description} />
        {/* The same numbers as words, most-trained first. */}
        <div className="flex-1 min-w-[136px]" aria-hidden>
          <PartList rows={view.rows} empty="No sets logged in the last 30 days." />
        </div>
      </div>
    </section>
  );
}
