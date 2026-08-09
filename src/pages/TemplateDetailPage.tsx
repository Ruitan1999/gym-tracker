import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import ConfirmModal from '../components/shared/ConfirmModal';
import ActionSheet from '../components/shared/ActionSheet';
import RenameModal from '../components/shared/RenameModal';
import ExerciseSelect, {
  CATEGORY_ACCENT,
  CATEGORY_CODE,
} from '../components/shared/ExerciseSelect';
import { useAppContext } from '../context/AppContext';
import { useDragReorder } from '../utils/useDragReorder';
import type { WorkoutGroup } from '../types';

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { appData } = useAppContext();
  const group = (appData.groups ?? []).find((g) => g.id === id);

  if (!group) {
    return (
      <PageShell title="Template" showBack>
        <p
          className="caps-tight text-[10px] text-center py-16"
          style={{ color: 'var(--color-text-faint)' }}
        >
          — NOT FOUND —
        </p>
      </PageShell>
    );
  }

  // Remount on a different template so the slot keys below re-seed cleanly.
  return <TemplateEditor key={group.id} group={group} />;
}

/**
 * A template can legitimately hold the same exercise twice, so rows are keyed by
 * a generated slot id rather than the exercise id — otherwise dragging would
 * confuse the duplicates for each other.
 */
interface Slot {
  key: string;
  exerciseId: string;
}

let slotCounter = 0;
const makeSlot = (exerciseId: string): Slot => ({ key: `slot-${++slotCounter}`, exerciseId });

function TemplateEditor({ group }: { group: WorkoutGroup }) {
  const { appData, updateGroup, deleteGroup } = useAppContext();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>(() => group.exerciseIds.map(makeSlot));
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exitingKey, setExitingKey] = useState<string | null>(null);

  const groupRef = useRef(group);
  groupRef.current = group;

  const commit = useCallback((next: Slot[]) => {
    setSlots(next);
    updateGroup({ ...groupRef.current, exerciseIds: next.map((s) => s.exerciseId) });
  }, [updateGroup]);

  const {
    registerItem,
    handleLongPressDown,
    handleLongPressClickCapture,
    handleKeyDown,
    draggingId,
  } = useDragReorder({
    items: slots,
    getId: (s: Slot) => s.key,
    onReorder: commit,
  });

  const addedIds = slots.map((s) => s.exerciseId);

  function handleRemove(key: string) {
    if (exitingKey) return;
    setExitingKey(key);
    window.setTimeout(() => {
      setExitingKey(null);
      commit(slots.filter((s) => s.key !== key));
    }, 260);
  }

  // The picker shows one row per exercise, so toggling off clears every slot
  // holding it; the row's own ✕ is what removes a single duplicate.
  function handlePick(exerciseId: string) {
    const has = slots.some((s) => s.exerciseId === exerciseId);
    commit(has ? slots.filter((s) => s.exerciseId !== exerciseId) : [...slots, makeSlot(exerciseId)]);
  }

  const addButton = (
    <button
      type="button"
      onClick={() => setShowPicker(true)}
      className="press w-full h-14 flex items-center justify-center gap-2.5"
      style={{
        color: 'var(--color-volt)',
        background: 'rgba(255, 87, 34, 0.06)',
        border: '1.5px dashed var(--color-volt)',
        borderRadius: '2px',
      }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="square" className="w-4 h-4">
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className="caps-tight text-[11px]" style={{ fontWeight: 700, letterSpacing: '0.12em' }}>
        ADD EXERCISE
      </span>
    </button>
  );

  return (
    <PageShell
      title="Template"
      showBack
      rightAction={
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          aria-label="Template actions"
          aria-haspopup="menu"
          className="h-9 w-9 flex items-center justify-center press"
          style={{ color: 'var(--color-text)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <circle cx="12" cy="5" r="1.75" />
            <circle cx="12" cy="12" r="1.75" />
            <circle cx="12" cy="19" r="1.75" />
          </svg>
        </button>
      }
    >
      <div className="flex flex-col gap-5">
        <header>
          <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
            TEMPLATE
          </div>
          <h2
            className="font-display mt-1"
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              fontVariationSettings: '"wdth" 92',
              color: 'var(--color-text)',
              lineHeight: 1.02,
            }}
          >
            {group.name}
          </h2>
          <div className="caps-tight text-[9px] mt-1.5" style={{ color: 'var(--color-text-faint)' }}>
            {String(slots.length).padStart(2, '0')} EXERCISE{slots.length === 1 ? '' : 'S'}
            {slots.length > 1 && ' · HOLD TO REORDER'}
          </div>
        </header>

        {slots.length === 0 ? (
          <div
            className="px-4 py-10 text-center"
            style={{
              background: 'var(--color-elev)',
              border: '1px dashed var(--color-line-2)',
              borderRadius: '2px',
            }}
          >
            <p
              className="font-display"
              style={{ fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)' }}
            >
              Nothing in this template yet
            </p>
            <p className="caps-tight text-[9px] mt-1.5" style={{ color: 'var(--color-text-faint)' }}>
              ADD THE EXERCISES YOU WANT TO REPEAT
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {slots.map((slot, index) => {
              const exercise = appData.exercises.find((e) => e.id === slot.exerciseId);
              const isDragging = draggingId === slot.key;
              return (
                <li
                  key={slot.key}
                  ref={registerItem(slot.key)}
                  className={`card relative${exitingKey === slot.key ? ' animate-set-exit' : ''}`}
                  style={{
                    border: `1px solid ${isDragging ? 'var(--color-volt)' : 'var(--color-line)'}`,
                    transition: 'border-color 150ms ease',
                    WebkitTouchCallout: 'none',
                  }}
                  onPointerDown={slots.length > 1 ? handleLongPressDown(slot.key) : undefined}
                  onClickCapture={slots.length > 1 ? handleLongPressClickCapture : undefined}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="flex items-stretch" style={{ minHeight: '56px' }}>
                    <div
                      className="flex-1 min-w-0 flex items-center gap-2.5 px-3"
                      tabIndex={slots.length > 1 ? 0 : undefined}
                      onKeyDown={handleKeyDown(slot.key)}
                    >
                      <span
                        className="caps-tight text-[10px] shrink-0"
                        style={{ color: 'var(--color-text)' }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className="self-stretch w-px shrink-0"
                        style={{ background: 'var(--color-line)' }}
                        aria-hidden
                      />
                      <span
                        className="flex-1 min-w-0 truncate"
                        style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)' }}
                      >
                        {exercise?.name ?? 'Unknown exercise'}
                      </span>
                      {exercise && (
                        <span
                          className="caps-tight text-[9px] px-2 py-0.5 shrink-0"
                          style={{
                            color: CATEGORY_ACCENT[exercise.category],
                            border: `1px solid ${CATEGORY_ACCENT[exercise.category]}`,
                            borderRadius: '2px',
                          }}
                        >
                          {CATEGORY_CODE[exercise.category]}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemove(slot.key)}
                      aria-label={`Remove ${exercise?.name ?? 'exercise'} from template`}
                      className="flex items-center justify-center shrink-0 press"
                      style={{
                        width: '48px',
                        color: 'var(--color-text-faint)',
                        borderLeft: '1px solid var(--color-line)',
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="square" className="w-[18px] h-[18px]">
                        <path d="M6 6l12 12M18 6L6 18" />
                      </svg>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {addButton}
      </div>

      {showPicker && (
        <ExerciseSelect
          title="Add to template"
          addedIds={addedIds}
          onSelect={handlePick}
          onClose={() => setShowPicker(false)}
        />
      )}

      {showMenu && (
        <ActionSheet
          eyebrow="TEMPLATE"
          title={group.name}
          onClose={() => setShowMenu(false)}
          items={[
            {
              label: 'RENAME',
              onSelect: () => {
                setRenaming(true);
                setShowMenu(false);
              },
            },
            {
              label: 'DELETE',
              destructive: true,
              onSelect: () => {
                setDeleting(true);
                setShowMenu(false);
              },
            },
          ]}
        />
      )}

      {renaming && (
        <RenameModal
          eyebrow="RENAME TEMPLATE"
          title="Rename template"
          initialValue={group.name}
          onSave={(name) => {
            updateGroup({ ...group, name });
            setRenaming(false);
          }}
          onClose={() => setRenaming(false)}
        />
      )}

      {deleting && (
        <ConfirmModal
          eyebrow="DELETE TEMPLATE"
          title={`Delete "${group.name}"?`}
          message="Saved workouts keep their history — only the template is removed."
          confirmLabel="DELETE →"
          cancelLabel="KEEP"
          destructive
          onConfirm={() => {
            deleteGroup(group.id);
            navigate('/groups');
          }}
          onClose={() => setDeleting(false)}
        />
      )}
    </PageShell>
  );
}
