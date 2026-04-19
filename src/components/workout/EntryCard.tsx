import { useRef, useCallback, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import SetRow from './SetRow';
import ConfirmModal from '../shared/ConfirmModal';
import type { WorkoutSet } from '../../types';

interface EntryCardProps {
  exerciseId: string;
  sets: WorkoutSet[];
  previousSets?: WorkoutSet[];
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
  previousSets,
  onSetsChange,
  onRemove,
  index = 0,
  collapsed = false,
  onToggleCollapsed,
}: EntryCardProps) {
  const { appData } = useAppContext();
  const exercise = appData.exercises.find((e) => e.id === exerciseId);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [exitingKey, setExitingKey] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevCollapsedRef = useRef(collapsed);

  const getScroller = useCallback((el: HTMLElement): HTMLElement => {
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const s = getComputedStyle(node);
      if (
        (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
        node.scrollHeight > node.clientHeight
      ) {
        return node;
      }
      node = node.parentElement;
    }
    return document.scrollingElement as HTMLElement;
  }, []);

  const scrollCardIntoView = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const container = getScroller(el);
      const containerRect = container.getBoundingClientRect
        ? container.getBoundingClientRect()
        : { top: 0, height: window.innerHeight };
      const cardRect = el.getBoundingClientRect();
      const offsetWithin = cardRect.top - containerRect.top;
      const target = container.scrollTop + offsetWithin - 12;
      if (offsetWithin < 0 || offsetWithin > containerRect.height * 0.4) {
        container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
      }
    });
  }, [getScroller]);

  const addSetBtnRef = useRef<HTMLButtonElement>(null);

  const scrollNewSetIntoView = useCallback(() => {
    const el = cardRef.current;
    const addBtn = addSetBtnRef.current;
    if (!el || !addBtn) return;
    requestAnimationFrame(() => {
      const container = getScroller(el);
      const containerRect = container.getBoundingClientRect();
      const paddingBottom = parseFloat(getComputedStyle(container).paddingBottom) || 0;
      const btnRect = addBtn.getBoundingClientRect();
      const desiredBottom =
        containerRect.top + containerRect.height - paddingBottom - 16;
      const delta = btnRect.bottom - desiredBottom;
      if (Math.abs(delta) > 4) {
        container.scrollTo({
          top: Math.max(0, container.scrollTop + delta),
          behavior: 'smooth',
        });
      }
    });
  }, [getScroller]);

  useEffect(() => {
    if (prevCollapsedRef.current && !collapsed) {
      scrollCardIntoView();
    }
    prevCollapsedRef.current = collapsed;
  }, [collapsed, scrollCardIntoView]);

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
    scrollNewSetIntoView();
  }, [sets, onSetsChange, scrollNewSetIntoView]);

  const handleRemoveSet = useCallback(
    (i: number) => {
      const key = stableKeysRef.current[i];
      if (!key || exitingKey) return;
      setExitingKey(key);
      window.setTimeout(() => {
        const idx = stableKeysRef.current.indexOf(key);
        if (idx === -1) {
          setExitingKey(null);
          return;
        }
        stableKeysRef.current.splice(idx, 1);
        const updated = sets
          .filter((_, j) => j !== idx)
          .map((s, j) => ({ ...s, setNumber: j + 1 }));
        setExitingKey(null);
        onSetsChange(updated);
      }, 300);
    },
    [sets, onSetsChange, exitingKey],
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

  const handleApplyPrevious = useCallback(
    (i: number, repsValue: number, weightValue: number) => {
      const updated = sets.map((s, idx) =>
        idx === i ? { ...s, reps: repsValue, weightKg: weightValue } : s,
      );
      onSetsChange(updated);
    },
    [sets, onSetsChange],
  );

  const totalReps = sets.reduce((acc, s) => acc + (s.reps || 0), 0);
  const topSet = sets.reduce<WorkoutSet | null>((best, s) => {
    if (s.weightKg <= 0 || s.reps <= 0) return best;
    if (!best) return s;
    if (s.weightKg > best.weightKg) return s;
    if (s.weightKg === best.weightKg && s.reps > best.reps) return s;
    return best;
  }, null);
  const topSetStr = topSet ? `${topSet.reps} × ${topSet.weightKg}` : '—';
  const topWeightStr = topSet ? String(topSet.weightKg) : '0';

  return (
    <div
      ref={cardRef}
      className="card-elev overflow-hidden relative"
      style={{ background: '#ffffff', border: '1px solid var(--color-line)' }}
    >
      {/* Header */}
      <div
        className="relative flex items-stretch"
        style={{ background: '#ffffff', minHeight: '64px' }}
      >
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center gap-3 min-w-0 flex-1 text-left press pl-4 pr-2 py-4"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand exercise' : 'Collapse exercise'}
        >
          <span
            className="caps-tight text-[10px] shrink-0 flex items-center justify-center"
            style={{ color: 'var(--color-text)', minWidth: '1.5rem' }}
          >
            {String(index + 1).padStart(2, '0')}
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
              className="caps-tight text-[9px] shrink-0 ml-auto"
              style={{ color: 'var(--color-text-faint)', fontVariantNumeric: 'tabular-nums' }}
            >
              {sets.length}×{totalReps} · {topWeightStr}KG
            </span>
          )}
          <span
            className={`shrink-0 flex items-center justify-center ${collapsed ? '' : 'ml-auto'}`}
            aria-hidden
            style={{
              width: '28px',
              height: '28px',
              color: 'var(--color-text-faint)',
              transition: 'transform 180ms ease',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="square" className="w-4 h-4">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>
        <button
          type="button"
          onClick={() => setShowRemoveConfirm(true)}
          aria-label="Remove exercise"
          className="flex items-center justify-center press shrink-0"
          style={{
            width: '56px',
            color: 'var(--color-text-faint)',
            borderLeft: '1px solid var(--color-line)',
          }}
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
        {sets.map((set, i) => {
          const key = stableKeysRef.current[i];
          return (
            <SetRow
              key={key}
              setNumber={set.setNumber}
              reps={set.reps}
              weightKg={set.weightKg}
              previousSet={previousSets?.[i]}
              onRepsChange={(v) => handleRepsChange(i, v)}
              onWeightChange={(v) => handleWeightChange(i, v)}
              onApplyPrevious={(r, w) => handleApplyPrevious(i, r, w)}
              onRemove={() => handleRemoveSet(i)}
              exiting={exitingKey === key}
            />
          );
        })}
      </div>

      {/* Add Set */}
      <button
        ref={addSetBtnRef}
        type="button"
        onClick={handleAddSet}
        className="relative w-full h-12 caps text-[11px] press flex items-center justify-center gap-2"
        style={{
          color: 'var(--color-text)',
          borderTop: '1px solid var(--color-line)',
          background: 'rgba(0, 0, 0, 0.015)',
          fontWeight: 700,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" className="w-4 h-4">
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
        <Stat label="TOP SET" value={topSetStr} divider />
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
