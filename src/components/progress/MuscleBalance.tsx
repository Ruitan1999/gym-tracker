import { useMemo, useState } from 'react';
import type { BodyPart, Exercise, Workout } from '../../types';
import { BODY_PART_LABELS } from '../../utils/bodyParts';
import { buildMuscleBalance, NOT_A_MUSCLE, RECOVERY_HOURS } from '../../utils/muscleBalance';
import type { BalanceWindow } from '../../utils/muscleBalance';
import Segmented from './Segmented';
import MuscleFigure from './MuscleFigure';
import type { PartPaint } from './MuscleFigure';
import { balancePaint, IDLE_PAINT } from './balancePaint';

type Lens = 'balance' | 'untrained' | 'recovering';

const WINDOW_OPTIONS: { value: BalanceWindow; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: 'all', label: 'All' },
];

const LENS_OPTIONS: { value: Lens; label: string }[] = [
  { value: 'balance', label: 'Balance' },
  { value: 'untrained', label: 'Untrained' },
  { value: 'recovering', label: 'Recovering' },
];

const WINDOW_WORDS: Record<BalanceWindow, string> = {
  week: 'the last 7 days',
  '30d': 'the last 30 days',
  '90d': 'the last 90 days',
  all: 'all time',
};

const IDLE = IDLE_PAINT;

function names(parts: BodyPart[]): string {
  return parts.map((p) => BODY_PART_LABELS[p].toLowerCase()).join(', ');
}

export default function MuscleBalance({
  workouts,
  exercises,
  now,
}: {
  workouts: Workout[];
  exercises: Exercise[];
  now?: Date;
}) {
  const [window, setWindow] = useState<BalanceWindow>('30d');
  const [lens, setLens] = useState<Lens>('untrained');
  const clock = useMemo(() => now ?? new Date(), [now]);

  const balance = useMemo(
    () => buildMuscleBalance(workouts, exercises, window, clock),
    [workouts, exercises, window, clock],
  );

  const ranked = useMemo(
    () =>
      (Object.entries(balance.sets) as [BodyPart, number][])
        .filter(([, n]) => n > 0)
        .sort((a, b) => b[1] - a[1]),
    [balance.sets],
  );

  const paint = (part: BodyPart): PartPaint => {
    if (lens === 'balance') return balancePaint(balance.sets)(part);
    if (lens === 'untrained') {
      if (NOT_A_MUSCLE.includes(part)) return IDLE;
      return balance.sets[part]
        ? { fill: 'var(--color-line-3)', opacity: 0.5 }
        : { fill: 'var(--color-rust)', opacity: 0.9 };
    }
    return balance.recovering.includes(part)
      ? { fill: 'var(--color-ember)', opacity: 0.9 }
      : IDLE;
  };

  const description =
    lens === 'balance'
      ? ranked.length === 0
        ? `No sets in ${WINDOW_WORDS[window]}.`
        : `Sets in ${WINDOW_WORDS[window]}: ${ranked.map(([p, n]) => `${BODY_PART_LABELS[p].toLowerCase()} ${n}`).join(', ')}.`
      : lens === 'untrained'
        ? balance.untrained.length === 0
          ? `Every body part trained in ${WINDOW_WORDS[window]}.`
          : `Not trained in ${WINDOW_WORDS[window]}: ${names(balance.untrained)}.`
        : balance.recovering.length === 0
          ? `Nothing trained in the last ${RECOVERY_HOURS} hours.`
          : `Trained in the last ${RECOVERY_HOURS} hours: ${names(balance.recovering)}.`;

  let heading: string;
  let rows: { part: BodyPart; note: string }[];
  let empty: string;
  if (lens === 'balance') {
    heading = `SETS · ${WINDOW_WORDS[window].toUpperCase()}`;
    rows = ranked.map(([part, n]) => ({
      part,
      note: `${n} ${n === 1 ? 'set' : 'sets'}${part === 'cardio' ? ' · not on figure' : ''}`,
    }));
    empty = 'No sets logged in this period.';
  } else if (lens === 'untrained') {
    heading = `NOT TRAINED · ${WINDOW_WORDS[window].toUpperCase()}`;
    rows = balance.untrained.map((part) => ({ part, note: '0 sets' }));
    empty = 'Every body part got work in this period.';
  } else {
    heading = `TRAINED IN THE LAST ${RECOVERY_HOURS} HOURS`;
    rows = balance.recovering.map((part) => ({
      part,
      note: `within ${RECOVERY_HOURS}h`,
    }));
    empty = `Nothing trained in the last ${RECOVERY_HOURS} hours.`;
  }

  return (
    <section className="card p-4" aria-label="Muscle balance">
      <h2 className="caps-tight text-[11px] mb-3" style={{ color: 'var(--color-text-faint)' }}>
        MUSCLE BALANCE
      </h2>
      <div className="flex flex-col gap-2">
        <Segmented label="Mode" value={lens} onChange={setLens} options={LENS_OPTIONS} />
        {lens !== 'recovering' && (
          <Segmented label="Period" value={window} onChange={setWindow} options={WINDOW_OPTIONS} />
        )}
      </div>

      <div className="flex flex-wrap items-start gap-4 mt-4">
        <MuscleFigure paint={paint} description={description} />
        <div className="flex-1 min-w-[136px]" aria-live="polite">
          <div className="caps-tight text-[11px] mb-2" style={{ color: 'var(--color-text-faint)' }}>
            {heading}
          </div>
          {rows.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              {empty}
            </p>
          ) : (
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
          )}
        </div>
      </div>
      <p className="text-[11px] mt-3" style={{ color: 'var(--color-text-faint)' }}>
        Coarse body parts only. Cardio is not counted as a muscle.
      </p>
    </section>
  );
}
