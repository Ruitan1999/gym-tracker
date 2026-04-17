import NumberInput from '../shared/NumberInput';
import { useAppContext } from '../../context/AppContext';
import { kgToLb, lbToKg } from '../../utils/conversions';

interface SetRowProps {
  setNumber: number;
  reps: number | '';
  weightKg: number | '';
  onRepsChange: (value: number | '') => void;
  onWeightChange: (valueKg: number | '') => void;
  onRemove: () => void;
}

export default function SetRow({
  setNumber,
  reps,
  weightKg,
  onRepsChange,
  onWeightChange,
  onRemove,
}: SetRowProps) {
  const { appData } = useAppContext();
  const isLb = appData.preferences.weightUnit === 'lb';

  const displayWeight: number | '' =
    weightKg === '' ? '' : isLb ? kgToLb(weightKg) : weightKg;

  function handleWeightChange(value: number | '') {
    if (value === '') {
      onWeightChange('');
    } else {
      onWeightChange(isLb ? lbToKg(value) : value);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <span className="text-sm text-gray-500 font-medium shrink-0 pb-3">
        #{setNumber}
      </span>
      <div className="flex-1 min-w-0">
        <NumberInput
          label="Reps"
          value={reps}
          onChange={onRepsChange}
          placeholder="0"
          min={0}
        />
      </div>
      <div className="flex-1 min-w-0">
        <NumberInput
          label={`Weight (${isLb ? 'lb' : 'kg'})`}
          value={displayWeight}
          onChange={handleWeightChange}
          placeholder="0"
          min={0}
        />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove set ${setNumber}`}
        className="text-red-500 shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 mb-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.519.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
