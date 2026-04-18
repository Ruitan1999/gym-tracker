import QuickRepChips from './QuickRepChips';
import WeightStepper from './WeightStepper';
import { useAppContext } from '../../context/AppContext';

interface SetRowProps {
  setNumber: number;
  reps: number | '';
  weightKg: number | '';
  onRepsChange: (value: number | '') => void;
  onWeightChange: (valueKg: number | '') => void;
  onRemove: () => void;
  exiting?: boolean;
}

export default function SetRow({
  setNumber,
  reps,
  weightKg,
  onRepsChange,
  onWeightChange,
  onRemove,
  exiting = false,
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

  return (
    <div
      data-set-row
      className={`relative${exiting ? ' animate-set-exit' : ''}`}
      style={{
        borderTop: '1px solid var(--color-line)',
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
      <div className="py-4 px-4 space-y-4">
        {/* Readout strip */}
        <div className="flex items-end gap-6">
          <div className="flex flex-col">
            <span
              className="caps-tight text-[9px]"
              style={{ color: 'var(--color-text-faint)' }}
            >
              SET {String(setNumber).padStart(2, '0')} REPS
            </span>
            <span
              key={String(reps)}
              className="font-mono leading-none mt-1 animate-tick-in"
              style={{
                fontSize: '2.25rem',
                fontWeight: 500,
                color:
                  repsDisplay === '—'
                    ? 'var(--color-text-faint)'
                    : 'var(--color-text)',
                fontVariantNumeric: 'tabular-nums',
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
              key={String(weightDisplay)}
              className="font-mono leading-none mt-1 animate-tick-in"
              style={{
                fontSize: '2.25rem',
                fontWeight: 500,
                color:
                  weightDisplay === '—'
                    ? 'var(--color-text-faint)'
                    : 'var(--color-volt)',
                fontVariantNumeric: 'tabular-nums',
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
      </div>
    </div>
  );
}
