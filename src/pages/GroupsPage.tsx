import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import ActionSheet from '../components/shared/ActionSheet';
import RenameModal from '../components/shared/RenameModal';
import ConfirmModal from '../components/shared/ConfirmModal';
import { useAppContext } from '../context/AppContext';
import { useDragReorder } from '../utils/useDragReorder';
import type { WorkoutGroup } from '../types';
import ExerciseStrip from '../components/shared/ExerciseStrip';
import { dayCodeLabel } from '../utils/schedule';
import { nextInRotation, trainingModeOf } from '../utils/rotation';
import type { TrainingMode } from '../types';
import MiniBodyMap from '../components/workout/MiniBodyMap';
import { bodyPartsOfTemplate } from '../utils/bodyParts';
import { beginTemplate, replaceDraftWith } from '../utils/startSession';

export default function GroupsPage() {
  const { appData, updateGroup, deleteGroup, reorderGroups, updatePreferences } =
    useAppContext();
  const navigate = useNavigate();
  const groups = appData.groups ?? [];
  const mode = trainingModeOf(appData.preferences);
  const rotationNextId = mode === 'rotation' ? nextInRotation(groups, appData.workouts)?.id : undefined;

  function setMode(next: TrainingMode) {
    if (next === mode) return;
    // Only the mode changes: each template keeps its weekdays, so switching
    // back brings the week exactly as it was.
    updatePreferences({ ...appData.preferences, trainingMode: next });
  }

  const [menuFor, setMenuFor] = useState<WorkoutGroup | null>(null);
  const [renaming, setRenaming] = useState<WorkoutGroup | null>(null);
  const [deleting, setDeleting] = useState<WorkoutGroup | null>(null);
  const [pendingStart, setPendingStart] = useState<WorkoutGroup | null>(null);

  const startOptions = { autoFill: !!appData.preferences.autoFillFromLast };

  // Any template can be trained from here, not only the one Next Up offers.
  // Same guard as the Next Up card: a session with real work in it is never
  // replaced without asking.
  function start(group: WorkoutGroup) {
    if (beginTemplate(group, appData.workouts, startOptions) === 'confirm') {
      setPendingStart(group);
      return;
    }
    navigate('/workout/new');
  }

  const {
    registerItem,
    handleLongPressDown,
    handleLongPressClickCapture,
    handleKeyDown,
    draggingId,
  } = useDragReorder({
    items: groups,
    getId: (g: WorkoutGroup) => g.id,
    onReorder: (next) => reorderGroups(next.map((g) => g.id)),
  });

  function createTemplate() {
    // Nothing is written until it is saved, so backing out leaves no empty
    // template behind.
    navigate('/groups/new');
  }

  const newTemplateButton = (
    <button
      type="button"
      onClick={createTemplate}
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
        NEW TEMPLATE
      </span>
    </button>
  );

  if (groups.length === 0) {
    return (
      <PageShell title="Plan">
        <EmptyState
          message="No template saved"
          description="BUILD ONE HERE, OR SAVE ANY WORKOUT AS A TEMPLATE"
          action={<div className="w-full">{newTemplateButton}</div>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Plan" disableRefresh={draggingId !== null}>
      <div className="flex flex-col gap-4">
        <HowYouTrain mode={mode} onChange={setMode} />

        <p className="caps-tight text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
          {String(groups.length).padStart(2, '0')} TEMPLATE{groups.length === 1 ? '' : 'S'}
          {groups.length > 1 && ' · HOLD TO REORDER'}
        </p>

        <ul className="flex flex-col gap-2">
          {groups.map((g, index) => {
            const names = g.exerciseIds
              .map((id) => appData.exercises.find((e) => e.id === id)?.name)
              .filter(Boolean) as string[];
            const isDragging = draggingId === g.id;

            return (
              <li
                key={g.id}
                ref={registerItem(g.id)}
                className="card relative"
                style={{
                  border: `1px solid ${isDragging ? 'var(--color-volt)' : 'var(--color-line)'}`,
                  transition: 'border-color 150ms ease',
                  WebkitTouchCallout: 'none',
                }}
                onPointerDown={groups.length > 1 ? handleLongPressDown(g.id) : undefined}
                onClickCapture={groups.length > 1 ? handleLongPressClickCapture : undefined}
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="flex items-stretch" style={{ minHeight: '68px' }}>
                  <button
                    type="button"
                    onClick={() => navigate(`/groups/${g.id}`)}
                    onKeyDown={handleKeyDown(g.id)}
                    className="flex-1 min-w-0 text-left press flex items-center px-3.5 py-3"
                  >
                    <span className="flex-1 min-w-0">
                      {/* Above the name: the days are what decide when this
                          one comes round. */}
                      {mode === 'rotation' ? (
                        // Order is what counts in rotation; the weekdays are
                        // kept but not shown, as they are not being used.
                        <span
                          className="caps-tight text-[11px] block truncate"
                          style={{
                            color:
                              g.id === rotationNextId
                                ? 'var(--color-volt)'
                                : 'var(--color-text-faint)',
                          }}
                        >
                          {String(index + 1).padStart(2, '0')}
                          {g.id === rotationNextId && ' · NEXT'}
                        </span>
                      ) : (
                        dayCodeLabel(g) && (
                        <span
                          className="caps-tight text-[11px] block truncate"
                          style={{ color: 'var(--color-volt)' }}
                        >
                          {dayCodeLabel(g)}
                        </span>
                        )
                      )}
                      <span className="flex items-baseline gap-1.5">
                        <span
                          className="font-display truncate"
                          style={{
                            fontSize: '1.0625rem',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            fontVariationSettings: '"wdth" 95',
                            color: 'var(--color-text)',
                          }}
                        >
                          {g.name}
                        </span>
                        <span
                          className="font-mono text-[12px] shrink-0"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          ({names.length})
                        </span>
                      </span>
                      {names.length === 0 ? (
                        <span
                          className="caps-tight text-[11px] block truncate mt-0.5"
                          style={{ color: 'var(--color-text-faint)' }}
                        >
                          EMPTY — TAP TO ADD EXERCISES
                        </span>
                      ) : (
                        <span className="mt-2 flex items-center justify-between gap-3">
                          <ExerciseStrip exerciseIds={g.exerciseIds} max={4} />
                          <span className="ml-auto">
                            <MiniBodyMap
                              parts={bodyPartsOfTemplate(g.exerciseIds, appData.exercises)}
                            />
                          </span>
                        </span>
                      )}
                    </span>
                  </button>

                  {names.length > 0 && (
                    <div className="flex items-center pr-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => start(g)}
                        aria-label={`Start ${g.name}`}
                        className="h-12 px-4 caps-tight text-[11px] press"
                        style={{
                          background: 'var(--color-volt)',
                          color: '#ffffff',
                          borderRadius: '999px',
                          fontWeight: 700,
                        }}
                      >
                        START
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setMenuFor(g)}
                    aria-label={`Actions for ${g.name}`}
                    aria-haspopup="menu"
                    className="flex items-center justify-center shrink-0 press"
                    style={{
                      width: '48px',
                      color: 'var(--color-text-faint)',
                      borderLeft: '1px solid var(--color-line)',
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <circle cx="12" cy="5" r="1.75" />
                      <circle cx="12" cy="12" r="1.75" />
                      <circle cx="12" cy="19" r="1.75" />
                    </svg>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        {newTemplateButton}
      </div>

      {menuFor && (
        <ActionSheet
          eyebrow="TEMPLATE"
          title={menuFor.name}
          onClose={() => setMenuFor(null)}
          items={[
            {
              label: 'EDIT EXERCISES',
              onSelect: () => {
                const target = menuFor;
                setMenuFor(null);
                navigate(`/groups/${target.id}`);
              },
            },
            {
              label: 'RENAME',
              onSelect: () => {
                setRenaming(menuFor);
                setMenuFor(null);
              },
            },
            {
              label: 'DELETE',
              destructive: true,
              onSelect: () => {
                setDeleting(menuFor);
                setMenuFor(null);
              },
            },
          ]}
        />
      )}

      {deleting && (
        <ConfirmModal
          eyebrow="DELETE TEMPLATE"
          title={`Delete "${deleting.name}"?`}
          message="Saved workouts keep their history — only the template is removed."
          confirmLabel="DELETE →"
          cancelLabel="KEEP"
          destructive
          onConfirm={() => {
            deleteGroup(deleting.id);
            setDeleting(null);
          }}
          onClose={() => setDeleting(null)}
        />
      )}

      {renaming && (
        <RenameModal
          eyebrow="RENAME TEMPLATE"
          title="Rename template"
          initialValue={renaming.name}
          onSave={(name) => {
            updateGroup({ ...renaming, name });
            setRenaming(null);
          }}
          onClose={() => setRenaming(null)}
        />
      )}

      {pendingStart && (
        <ConfirmModal
          eyebrow="WORKOUT IN PROGRESS"
          title={`Start "${pendingStart.name}" instead?`}
          message="Your current workout hasn't been saved yet — starting a new one will discard it."
          confirmLabel="DISCARD & START →"
          cancelLabel="KEEP CURRENT"
          destructive
          onConfirm={() => {
            replaceDraftWith(pendingStart, appData.workouts, startOptions);
            setPendingStart(null);
            navigate('/workout/new');
          }}
          onClose={() => setPendingStart(null)}
        />
      )}
    </PageShell>
  );
}

/**
 * The two ways to train, as a pill with the chosen side raised. A radio group
 * rather than tabs: it is a setting, and exactly one side is always chosen.
 */
function HowYouTrain({
  mode,
  onChange,
}: {
  mode: TrainingMode;
  onChange: (mode: TrainingMode) => void;
}) {
  const options: { value: TrainingMode; label: string }[] = [
    { value: 'week', label: 'Fixed Week' },
    { value: 'rotation', label: 'Rotation' },
  ];
  return (
    <section
      className="card p-3.5"
      style={{ border: '1px solid var(--color-line)' }}
      aria-label="How you train"
    >
      <p className="caps-tight text-[11px] mb-2.5" style={{ color: 'var(--color-text-faint)' }}>
        HOW YOU TRAIN
      </p>
      <div
        role="radiogroup"
        aria-label="How you train"
        className="grid grid-cols-2 gap-1 p-1"
        style={{
          background: 'var(--color-elev)',
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius)',
        }}
      >
        {options.map((o) => {
          const selected = o.value === mode;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className="press caps-tight text-[11px]"
              style={{
                minHeight: '48px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                borderRadius: 'calc(var(--radius) - 2px)',
                background: selected ? 'var(--color-surface)' : 'transparent',
                color: selected ? 'var(--color-text)' : 'var(--color-text-muted)',
                border: selected ? '1px solid var(--color-line-2)' : '1px solid transparent',
                boxShadow: selected ? '0 1px 3px rgba(0, 0, 0, 0.25)' : 'none',
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <p
        className="mt-2.5"
        style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}
      >
        {mode === 'week'
          ? 'Each template has its own weekdays.'
          : 'Templates take turns in the order below; Next Up is whichever is next.'}
      </p>
    </section>
  );
}
