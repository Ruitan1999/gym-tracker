import { useCallback, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import ConfirmModal from '../components/shared/ConfirmModal';
import ActionSheet from '../components/shared/ActionSheet';
import RenameModal from '../components/shared/RenameModal';
import ExerciseSelect from '../components/shared/ExerciseSelect';
import { BODY_PART_ACCENT, BODY_PART_CODE } from '../utils/bodyParts';
import { useAppContext } from '../context/AppContext';
import { useDragReorder } from '../utils/useDragReorder';
import type { WorkoutGroup } from '../types';
import ExerciseThumb from '../components/shared/ExerciseThumb';
import { imageForExercise } from '../utils/exerciseImage';

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { appData } = useAppContext();
  const isNew = id === 'new';
  const groups = appData.groups ?? [];

  // A template being created exists only here until it is saved, so backing
  // out of one leaves nothing behind. It used to be written the moment the
  // button was pressed, which left an empty "Template 4" every time.
  const [draft] = useState<WorkoutGroup>(() => ({
    id: crypto.randomUUID(),
    name: `Template ${groups.length + 1}`,
    exerciseIds: [],
    createdAt: new Date().toISOString(),
  }));

  const group = isNew ? draft : groups.find((g) => g.id === id);

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
  return <TemplateEditor key={group.id} group={group} isNew={isNew} />;
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

function TemplateEditor({ group, isNew }: { group: WorkoutGroup; isNew: boolean }) {
  const { appData, addGroup, updateGroup, deleteGroup, exerciseImages, showToast } = useAppContext();
  const navigate = useNavigate();

  const [slots, setSlots] = useState<Slot[]>(() => group.exerciseIds.map(makeSlot));
  const [showPicker, setShowPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const [exitingKey, setExitingKey] = useState<string | null>(null);

  const groupRef = useRef(group);
  groupRef.current = group;

  /**
   * Editing the line-up is local until it is saved.
   *
   * It used to write through on every add, removal and reorder, so there was
   * nothing to cancel — pulling an exercise out to see how it read had already
   * changed the template, and the only way back was to put it in again in the
   * right place.
   */
  const commit = useCallback((next: Slot[]) => setSlots(next), []);

  const editedIds = slots.map((s) => s.exerciseId);
  // A template being created always has something to decide about, even empty:
  // there has to be a visible way to abandon it.
  const dirty =
    isNew ||
    editedIds.length !== group.exerciseIds.length ||
    editedIds.some((id, i) => id !== group.exerciseIds[i]);

  function saveChanges() {
    if (isNew) {
      addGroup({ ...groupRef.current, name: draftName, exerciseIds: editedIds });
      showToast('Template created');
      navigate(`/groups/${groupRef.current.id}`, { replace: true });
      return;
    }
    updateGroup({ ...groupRef.current, exerciseIds: editedIds });
    showToast('Template updated');
  }

  function discardChanges() {
    if (isNew) {
      navigate(-1);
      return;
    }
    setSlots(group.exerciseIds.map(makeSlot));
  }

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
        background: 'var(--color-volt-wash)',
        border: '1.5px dashed var(--color-volt)',
        borderRadius: 'var(--radius)',
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
      onBack={dirty ? () => setConfirmLeave(true) : undefined}
      disableRefresh={draggingId !== null}
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
            {isNew ? draftName : group.name}
          </h2>
          <div className="caps-tight text-[9px] mt-1.5" style={{ color: 'var(--color-text-faint)' }}>
            {String(slots.length).padStart(2, '0')} EXERCISE{slots.length === 1 ? '' : 'S'}
            {slots.length > 1 && ' · HOLD TO REORDER'}
            {dirty && <span style={{ color: 'var(--color-volt)' }}> · UNSAVED</span>}
          </div>
        </header>

        {slots.length === 0 ? (
          <div
            className="px-4 py-10 text-center"
            style={{
              background: 'var(--color-elev)',
              border: '1px dashed var(--color-line-2)',
              borderRadius: 'var(--radius)',
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
                      <ExerciseThumb
                        src={slot.exerciseId ? imageForExercise(slot.exerciseId, exerciseImages) : null}
                        size={34}
                      />
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
                            color: BODY_PART_ACCENT[exercise.bodyPart],
                            border: `1px solid ${BODY_PART_ACCENT[exercise.bodyPart]}`,
                            borderRadius: 'var(--radius)',
                          }}
                        >
                          {BODY_PART_CODE[exercise.bodyPart]}
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

        {/* Only present when there is something to decide about. Sticky rather
            than in the flow: the list can be long, and the two are needed from
            wherever the last change was made. */}
        {dirty && (
          <div
            className="sticky bottom-0 grid grid-cols-2 gap-2 pt-3 pb-3"
            style={{
              background: 'var(--color-bg)',
              borderTop: '1px solid var(--color-line)',
              marginBottom: 'calc(-0.75rem)',
            }}
          >
            <button
              type="button"
              onClick={discardChanges}
              className="h-12 btn-ghost press caps-tight text-[11px]"
              style={{ borderRadius: 'var(--radius)' }}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={saveChanges}
              className="h-12 btn-volt press caps-tight text-[11px]"
              style={{ borderRadius: 'var(--radius)' }}
            >
              {isNew ? 'CREATE TEMPLATE →' : 'SAVE CHANGES →'}
            </button>
          </div>
        )}
      </div>

      {confirmLeave && (
        <ConfirmModal
          eyebrow="UNSAVED CHANGES"
          title="Leave without saving?"
          message={
            isNew
              ? 'This template has not been created yet, so it will not be kept.'
              : 'The exercises you added, removed or reordered go back to how the template was.'
          }
          confirmLabel="DISCARD →"
          cancelLabel="KEEP EDITING"
          destructive
          onConfirm={() => {
            setConfirmLeave(false);
            navigate(-1);
          }}
          onClose={() => setConfirmLeave(false)}
        />
      )}

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
            if (isNew) setDraftName(name);
            else updateGroup({ ...group, name });
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
