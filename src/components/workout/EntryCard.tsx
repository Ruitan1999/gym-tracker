import { useRef, useCallback, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import SetRow from './SetRow';
import ConfirmModal from '../shared/ConfirmModal';
import type { WorkoutSet } from '../../types';

interface EntryCardProps {
  exerciseId: string;
  sets: WorkoutSet[];
  onSetsChange: (sets: WorkoutSet[]) => void;
  onRemove: () => void;
  index?: number;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

let globalKeyCounter = 0;

export default function EntryCard({
  exerciseId,
  sets,
  onSetsChange,
  onRemove,
  index = 0,
  collapsed = false,
  onToggleCollapsed,
}: EntryCardProps) {
  const { appData } = useAppContext();
  const exercise = appData.exercises.find((e) => e.id === exerciseId);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const stableKeysRef = useRef<string[]>([]);
  while (stableKeysRef.current.length < sets.length) {
    stableKeysRef.current.push(`set-${++globalKeyCounter}`);
  }
  if (stableKeysRef.current.length > sets.length) {
    stableKeysRef.current.length = sets.length;
  }

  const handleAddSet = useCallback(() => {
    const lastSet = sets.length > 0 ? sets[sets.length - 1] : null;
    const newSet: WorkoutSet = {
      setNumber: sets.length + 1,
      reps: lastSet?.reps ?? 0,
      weightKg: lastSet?.weightKg ?? 0,
    };
    stableKeysRef.current.push(`set-${++globalKeyCounter}`);
    onSetsChange([...sets, newSet]);
  }, [sets, onSetsChange]);

  const handleRemoveSet = useCallback(
    (i: number) => {
      stableKeysRef.current.splice(i, 1);
      const updated = sets
        .filter((_, idx) => idx !== i)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      onSetsChange(updated);
    },
    [sets, onSetsChange],
  );

  const handleRepsChange = useCallback(
    (i: number, value: number | '') => {
      const updated = sets.map((s, idx) =>
        idx === i ? { ...s, reps: value === '' ? 0 : value } : s,
      );
      onSetsChange(updated);
    },
    [sets, onSetsChange],
  );

  const handleWeightChange = useCallback(
    (i: number, valueKg: number | '') => {
      const updated = sets.map((s, idx) =>
        idx === i ? { ...s, weightKg: valueKg === '' ? 0 : valueKg } : s,
      );
      onSetsChange(updated);
    },
    [sets, onSetsChange],
  );

  const totalReps = sets.reduce((acc, s) => acc + (s.reps || 0), 0);
  const volumeKg = sets.reduce((acc, s) => acc + s.reps * s.weightKg, 0);
  const volumeStr =
    volumeKg >= 10000
      ? `${(volumeKg / 1000).toFixed(1)}K`
      : Math.round(volumeKg).toString();

  return (
    <div
      className="card-elev overflow-hidden relative"
      style={{ background: '#ffffff', border: '1px solid var(--color-line)' }}
    >
      {/* Header */}
      <div
        className="relative flex items-center justify-between pl-4 pr-1.5 py-3.5"
        style={{ background: '#ffffff' }}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center gap-3 min-w-0 flex-1 text-left press"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand exercise' : 'Collapse exercise'}
        >
          <span
            className="caps-tight text-[10px] shrink-0 flex items-center justify-center"
            style={{ color: 'var(--color-text)', minWidth: '1.5rem' }}
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-3.5 h-3.5">
                <path d="M6 15l6-6 6 6" />
              </svg>
            ) : (
              <span>{String(index + 1).padStart(2, '0')}</span>
            )}
          </span>
          <div
            className="self-stretch w-px"
            style={{ background: 'var(--color-line)' }}
            aria-hidden
          />
          <h3
            className="font-display leading-tight truncate"
            style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              fontVariationSettings: '"wdth" 95',
              color: 'var(--color-text)',
            }}
          >
            {exercise?.name ?? 'Unknown Exercise'}
          </h3>
          {collapsed && (
            <span
              className="caps-tight text-[9px] shrink-0 ml-auto pr-2"
              style={{ color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}
            >
              {sets.length}×{totalReps} · {volumeStr}KG
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowRemoveConfirm(true)}
          aria-label="Remove exercise"
          className="w-10 h-10 flex items-center justify-center press shrink-0"
          style={{ color: 'var(--color-text-faint)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="square" className="w-4 h-4">
            <path d="M4 7h16" />
            <path d="M10 4h4" />
            <path d="M6 7l1 13h10l1-13" />
            <path d="M10 11v6M14 11v6" />
          </svg>
        </button>
      </div>

      {collapsed ? null : (
        <>
      {/* Sets */}
      <div className="relative">
        {sets.map((set, i) => (
          <SetRow
            key={stableKeysRef.current[i]}
            setNumber={set.setNumber}
            reps={set.reps}
            weightKg={set.weightKg}
            onRepsChange={(v) => handleRepsChange(i, v)}
            onWeightChange={(v) => handleWeightChange(i, v)}
            onRemove={() => handleRemoveSet(i)}
          />
        ))}
      </div>

      {/* Add Set */}
      <button
        type="button"
        onClick={handleAddSet}
        className="relative w-full h-12 caps text-[10px] press flex items-center justify-center gap-2"
        style={{
          color: 'var(--color-text)',
          borderTop: '1px solid var(--color-line)',
          background: 'transparent',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-3.5 h-3.5">
          <path d="M12 5v14M5 12h14" />
        </svg>
        ADD SET
      </button>

      {/* Stat strip */}
      <div
        className="relative grid grid-cols-3"
        style={{
          background: 'transparent',
          borderTop: '1px solid var(--color-line)',
        }}
      >
        <Stat label="SETS" value={sets.length} />
        <Stat label="TOTAL REPS" value={totalReps} divider />
        <Stat label="VOLUME KG" value={volumeStr} divider />
      </div>
        </>
      )}
      {showRemoveConfirm && (
        <ConfirmModal
          eyebrow="REMOVE EXERCISE"
          title={`Remove ${exercise?.name ?? 'this exercise'}?`}
          message="Its sets will be discarded from this session."
          confirmLabel="REMOVE →"
          destructive
          onConfirm={() => {
            setShowRemoveConfirm(false);
            onRemove();
          }}
          onClose={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, divider }: { label: string; value: string | number; divider?: boolean }) {
  return (
    <div
      className="px-3 py-2.5"
      style={divider ? { borderLeft: '1px solid var(--color-line)' } : undefined}
    >
      <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
      <div
        className="font-mono leading-none mt-1"
        style={{
          fontSize: '1.125rem',
          fontWeight: 500,
          color: 'var(--color-text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
