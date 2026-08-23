import QuickRepChips from './QuickRepChips';
import WeightStepper from './WeightStepper';
import { useAppContext } from '../../context/AppContext';

// Pastel tints with the hue carried by the numeral rather than the fill — small
// dark type on a pale ground reads better than white on a saturated block, and
// every pair below clears WCAG AA.
const SET_ACCENTS = [
  { bg: '#ECEDEF', fg: '#454B54', line: '#DCDEE2' },
  { bg: '#E5ECFA', fg: '#2F5FBE', line: '#CFDCF5' },
  { bg: '#F5EEDC', fg: '#856210', line: '#EAE0C6' },
  { bg: '#F9E8EA', fg: '#AE4453', line: '#F0D5D9' },
  { bg: '#FAE9E0', fg: '#A34A1E', line: '#F2D7C9' },
];

function setAccent(setNumber: number) {
  return SET_ACCENTS[(setNumber - 1) % SET_ACCENTS.length];
}

interface SetRowProps {
  setNumber: number;
  reps: number | '';
  weightKg: number | '';
  onRepsChange: (value: number | '') => void;
  onWeightChange: (valueKg: number | '') => void;
  onApplyPrevious?: (reps: number, weightKg: number) => void;
  onRemove: () => void;
  exiting?: boolean;
  entering?: boolean;
  previousSet?: { reps: number; weightKg: number };
}

export default function SetRow({
  setNumber,
  reps,
  weightKg,
  onRepsChange,
  onWeightChange,
  onApplyPrevious,
  onRemove,
  exiting = false,
  entering = false,
  previousSet,
}: SetRowProps) {
  const { appData } = useAppContext();
  const { preferences } = appData;
  const step = preferences.weightStepKg;

  const displayWeight: number | '' = weightKg;

  function handleWeightChange(value: number | '') {
    onWeightChange(value);
  }

  const repsDisplay = typeof reps === 'number' && reps > 0 ? reps : '—';
  const weightDisplay =
    typeof displayWeight === 'number' && displayWeight > 0
      ? displayWeight
      : '—';

  const prevReps = previousSet?.reps ?? 0;
  const prevWeight = previousSet?.weightKg ?? 0;
  const hasPrevious = !!previousSet && (prevReps > 0 || prevWeight > 0);

  let previousLabel = '';
  if (hasPrevious) {
    if (prevReps > 0 && prevWeight > 0) {
      previousLabel = `${prevReps} × ${prevWeight} KG`;
    } else if (prevReps > 0) {
      previousLabel = `${prevReps} REPS`;
    } else {
      previousLabel = `${prevWeight} KG`;
    }
  }

  function handleApplyPrevious() {
    if (!previousSet) return;
    if (onApplyPrevious) {
      onApplyPrevious(previousSet.reps, previousSet.weightKg);
      return;
    }
    onRepsChange(previousSet.reps);
    onWeightChange(previousSet.weightKg);
  }

  const accent = setAccent(setNumber);

  return (
    <div
      data-set-row
      className={`relative${exiting ? ' animate-set-exit' : ''}${entering ? ' animate-set-enter' : ''}`}
      style={{
        borderTop: '1px solid var(--color-line)',
        background: setNumber % 2 === 0 ? 'rgba(10, 10, 10, 0.025)' : 'transparent',
      }}
    >
      {/* Top-right delete button */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove set ${setNumber}`}
        className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center press z-10"
        style={{ color: 'var(--color-text-faint)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="square" className="w-[18px] h-[18px]">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {/* Content: big live readouts + controls */}
      <div className="py-4 pl-4 pr-4 space-y-4">
        {/* Set number badge */}
        <div className="flex items-center gap-2">
          <span
            className="font-mono shrink-0 flex items-center justify-center"
            style={{
              width: 30,
              height: 30,
              background: accent.bg,
              color: accent.fg,
              boxShadow: `inset 0 0 0 1px ${accent.line}`,
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(setNumber).padStart(2, '0')}
          </span>
          <span
            className="caps-tight text-[9px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            SET
          </span>
        </div>

        {/* Readout strip */}
        <div className="flex items-end gap-6">
          <div className="flex flex-col">
            <span
              className="caps-tight text-[9px]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              REPS
            </span>
            <span
              className="font-mono leading-none mt-1"
              style={{
                fontSize: '2.25rem',
                fontWeight: 500,
                color:
                  repsDisplay === '—'
                    ? 'var(--color-text-faint)'
                    : 'var(--color-text)',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 120ms ease',
              }}
            >
              {repsDisplay}
            </span>
          </div>

          <div
            className="self-stretch w-px"
            style={{ background: 'var(--color-line)' }}
            aria-hidden
          />

          <div className="flex flex-col">
            <span
              className="caps-tight text-[9px]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              LOAD KG
            </span>
            <span
              className="font-mono leading-none mt-1"
              style={{
                fontSize: '2.25rem',
                fontWeight: 500,
                color:
                  weightDisplay === '—'
                    ? 'var(--color-text-faint)'
                    : 'var(--color-volt)',
                fontVariantNumeric: 'tabular-nums',
                transition: 'color 120ms ease',
              }}
            >
              {weightDisplay}
            </span>
          </div>
        </div>

        {/* Reps chips */}
        <div>
          <div
            className="caps-tight text-[9px] mb-1.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            REPS
          </div>
          <QuickRepChips values={preferences.quickReps} current={reps} onPick={onRepsChange} />
        </div>

        {/* Weight stepper */}
        <div>
          <div
            className="caps-tight text-[9px] mb-1.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            LOAD STEP {step} KG
          </div>
          <WeightStepper
            value={displayWeight}
            onChange={handleWeightChange}
            step={step}
            unit="kg"
          />
        </div>

        {hasPrevious && (
          <button
            type="button"
            onClick={handleApplyPrevious}
            className="press w-full flex items-center gap-3 py-2 px-3"
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius)',
              background: 'transparent',
            }}
          >
            <span
              className="caps-tight text-[9px]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              LAST
            </span>
            <span
              className="font-mono text-[13px]"
              style={{
                color: 'var(--color-text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {previousLabel}
            </span>
            <span
              className="caps-tight text-[9px] ml-auto"
              style={{ color: 'var(--color-text-faint)' }}
            >
              TAP TO USE →
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
