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
  done?: boolean;
  onToggleDone?: () => void;
  dragHandleProps?: {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  };
  isDragging?: boolean;
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
  done = false,
  onToggleDone,
  dragHandleProps,
  isDragging = false,
}: EntryCardProps) {
  const { appData } = useAppContext();
  const exercise = appData.exercises.find((e) => e.id === exerciseId);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [exitingKey, setExitingKey] = useState<string | null>(null);
  const [enteringKey, setEnteringKey] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevCollapsedRef = useRef(collapsed);

  const getScroller = useCallback((el: HTMLElement): HTMLElement | null => {
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
    return (document.scrollingElement as HTMLElement | null) ?? null;
  }, []);

  const scrollCardIntoView = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      // The card can be gone by the time this frame runs — removed, or the whole
      // form unmounted on save.
      if (!el.isConnected) return;
      const container = getScroller(el);
      if (!container) return;
      const containerRect = container.getBoundingClientRect
        ? container.getBoundingClientRect()
        : { top: 0, height: window.innerHeight };
      const cardRect = el.getBoundingClientRect();
      const offsetWithin = cardRect.top - containerRect.top;
      const target = container.scrollTop + offsetWithin - 12;
      if (offsetWithin < 0 || offsetWithin > containerRect.height * 0.4) {
        container.scrollTo({ top: Math.max(0, target) });
      }
    });
  }, [getScroller]);

  const addSetBtnRef = useRef<HTMLButtonElement>(null);

  const scrollNewSetIntoView = useCallback(() => {
    const el = cardRef.current;
    const addBtn = addSetBtnRef.current;
    if (!el || !addBtn) return;
    requestAnimationFrame(() => {
      if (!el.isConnected || !addBtn.isConnected) return;
      const container = getScroller(el);
      if (!container?.getBoundingClientRect) return;
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
    // Either direction can leave this card off-screen: expanding pushes its own
    // body down, collapsing pulls everything below it up by the card's height.
    if (prevCollapsedRef.current !== collapsed) {
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
    const newKey = `set-${++globalKeyCounter}`;
    stableKeysRef.current.push(newKey);
    setEnteringKey(newKey);
    onSetsChange([...sets, newSet]);
    scrollNewSetIntoView();
    window.setTimeout(() => {
      setEnteringKey((current) => (current === newKey ? null : current));
    }, 320);
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
  const topWeightStr = topSet ? String(topSet.weightKg) : '0';

  return (
    <div
      ref={cardRef}
      className="card-elev overflow-hidden relative"
      style={{
        background: '#ffffff',
        border: `1px solid ${isDragging ? 'var(--color-volt)' : 'var(--color-line)'}`,
        transition: 'border-color 150ms ease',
      }}
    >
      {/* Header — the done rail lives here so it stops at the header edge
          instead of running the full height of an expanded card. */}
      <div
        className="relative flex items-stretch"
        style={{
          background: done ? 'var(--color-done-tint)' : '#ffffff',
          minHeight: '64px',
          boxShadow: done ? 'inset 4px 0 0 0 var(--color-done)' : 'none',
          transition: 'background-color 200ms ease, box-shadow 200ms ease',
        }}
      >
        {dragHandleProps && (
          <button
            type="button"
            aria-label="Drag to reorder exercise"
            className="flex items-center justify-center shrink-0"
            style={{
              width: '30px',
              color: isDragging ? 'var(--color-text)' : 'var(--color-text-faint)',
              borderRight: '1px solid var(--color-line)',
              touchAction: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onPointerDown={dragHandleProps.onPointerDown}
            onKeyDown={dragHandleProps.onKeyDown}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <circle cx="9" cy="6" r="1.5" />
              <circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" />
              <circle cx="15" cy="18" r="1.5" />
            </svg>
          </button>
        )}
        {/* Collapsed cards keep a compact toggle here; expanded cards get the
            full-width one under the stat strip, where the sets just ended. */}
        {collapsed && (
          <button
            type="button"
            onClick={onToggleDone}
            aria-pressed={!!done}
            aria-label={done ? 'Mark exercise not complete' : 'Mark exercise complete'}
            className="flex items-center justify-center shrink-0 press"
            style={{
              width: '38px',
              borderRight: '1px solid var(--color-line)',
            }}
          >
            <span
              aria-hidden
              className="flex items-center justify-center"
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '3px',
                border: `1.5px solid ${done ? 'var(--color-done)' : 'var(--color-line-2)'}`,
                background: done ? 'var(--color-done)' : 'transparent',
                transition: 'background-color 150ms ease, border-color 150ms ease',
              }}
            >
              {done && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3} strokeLinecap="square" className="w-3 h-3">
                  <path d="M4 12l5 5L20 6" />
                </svg>
              )}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex items-center gap-2 min-w-0 flex-1 text-left press pl-2.5 pr-1 py-4"
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand exercise' : 'Collapse exercise'}
        >
          <span
            className="caps-tight text-[10px] shrink-0 flex items-center justify-center"
            style={{ color: 'var(--color-text)', minWidth: '1.25rem' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <div
            className="self-stretch w-px shrink-0"
            style={{ background: 'var(--color-line)' }}
            aria-hidden
          />
          <div className="flex-1 min-w-0">
            <h3
              className="font-display leading-tight truncate"
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontVariationSettings: '"wdth" 95',
                color: done && collapsed ? 'var(--color-text-muted)' : 'var(--color-text)',
              }}
            >
              {exercise?.name ?? 'Unknown Exercise'}
            </h3>
            {collapsed && (
              <div
                className="caps-tight text-[9px] truncate mt-0.5"
                style={{
                  color: done ? 'var(--color-done-deep)' : 'var(--color-text-faint)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {done && <span style={{ fontWeight: 700 }}>DONE · </span>}
                {sets.length}×{totalReps} · {topWeightStr}KG
              </div>
            )}
          </div>
          <span
            className={`shrink-0 flex items-center justify-center ${collapsed ? '' : 'ml-auto'}`}
            aria-hidden
            style={{
              width: '24px',
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
            width: '46px',
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
              entering={enteringKey === key}
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

      {/* Complete — the last thing you touch after logging the sets. Pending is
          the loud state because it's the one asking for action; completed falls
          back to a quiet line. */}
      <button
        type="button"
        onClick={onToggleDone}
        aria-pressed={!!done}
        aria-label={done ? 'Mark exercise not complete' : 'Mark exercise complete'}
        className={`relative w-full h-14 caps-tight text-[11px] press flex items-center gap-2.5 ${done ? 'justify-start px-4' : 'justify-center'}`}
        style={{
          borderTop: `1px solid ${done ? 'var(--color-done-line)' : 'var(--color-line)'}`,
          background: done ? 'var(--color-done-tint)' : 'var(--color-volt)',
          color: done ? 'var(--color-done-deep)' : '#ffffff',
          fontWeight: 700,
          letterSpacing: '0.12em',
          transition: 'background-color 180ms ease, color 180ms ease',
        }}
      >
        {done ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square" className="w-4 h-4 shrink-0">
              <path d="M4 12l5 5L20 6" />
            </svg>
            COMPLETED
            <span
              className="caps-tight text-[9px] ml-auto"
              style={{
                color: 'var(--color-text-muted)',
                borderBottom: '1px solid var(--color-line-2)',
                paddingBottom: '1px',
                letterSpacing: '0.1em',
              }}
            >
              UNDO
            </span>
          </>
        ) : (
          'COMPLETE EXERCISE →'
        )}
      </button>
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

