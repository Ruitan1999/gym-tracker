import NumberInput from '../shared/NumberInput';

interface WeightStepperProps {
  label?: string;
  value: number | '';
  onChange: (value: number | '') => void;
  step: number;
  unit: string;
}

function roundToStep(value: number, step: number): number {
  const precision = step.toString().split('.')[1]?.length ?? 0;
  return Number(value.toFixed(Math.max(precision, 2)));
}

export default function WeightStepper({ label, value, onChange, step, unit }: WeightStepperProps) {
  const numeric = typeof value === 'number' ? value : 0;
  const decrementDisabled = typeof value === 'number' && value <= 0;

  function handleDecrement() {
    if (value === '' || typeof value !== 'number') return;
    const next = Math.max(0, value - step);
    onChange(roundToStep(next, step));
  }

  function handleIncrement() {
    const base = value === '' ? 0 : numeric;
    onChange(roundToStep(base + step, step));
  }

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span
          className="caps-tight text-[9px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {label}
        </span>
      )}
      <div
        className="flex items-stretch"
        style={{
          border: '1px solid var(--color-line-2)',
          borderRadius: '2px',
          background: 'var(--color-ink)',
        }}
      >
        <div className="flex-1 min-w-0 flex items-center">
          <NumberInput value={value} onChange={onChange} placeholder="0" min={0} variant="bare" />
          <span
            className="caps-tight text-[10px] pr-3"
            style={{ color: 'var(--color-text-faint)' }}
          >
            {unit.toUpperCase()}
          </span>
        </div>
        <button
          type="button"
          onClick={handleDecrement}
          disabled={decrementDisabled}
          aria-label={`Decrease weight by ${step} ${unit}`}
          className="w-12 h-12 flex items-center justify-center press disabled:opacity-30"
          style={{
            borderLeft: '1px solid var(--color-line-2)',
            color: 'var(--color-text)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-5 h-5">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleIncrement}
          aria-label={`Increase weight by ${step} ${unit}`}
          className="w-12 h-12 flex items-center justify-center press"
          style={{
            borderLeft: '1px solid var(--color-line-2)',
            background: 'var(--color-volt)',
            color: '#ffffff',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" className="w-5 h-5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}
