import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/layout/PageShell';
import EmptyState from '../components/shared/EmptyState';
import ConfirmModal from '../components/shared/ConfirmModal';
import ActionSheet from '../components/shared/ActionSheet';
import RenameModal from '../components/shared/RenameModal';
import { useAppContext } from '../context/AppContext';
import { useDragReorder } from '../utils/useDragReorder';
import type { WorkoutGroup } from '../types';

export default function GroupsPage() {
  const { appData, addGroup, updateGroup, deleteGroup, reorderGroups } = useAppContext();
  const navigate = useNavigate();
  const groups = appData.groups ?? [];

  const [menuFor, setMenuFor] = useState<WorkoutGroup | null>(null);
  const [renaming, setRenaming] = useState<WorkoutGroup | null>(null);
  const [deleting, setDeleting] = useState<WorkoutGroup | null>(null);

  const { registerItem, handlePointerDown, handleKeyDown, draggingId } = useDragReorder({
    items: groups,
    getId: (g: WorkoutGroup) => g.id,
    onReorder: (next) => reorderGroups(next.map((g) => g.id)),
  });

  function createTemplate() {
    const group: WorkoutGroup = {
      id: crypto.randomUUID(),
      name: `Template ${groups.length + 1}`,
      exerciseIds: [],
      createdAt: new Date().toISOString(),
    };
    addGroup(group);
    navigate(`/groups/${group.id}`);
  }

  const newTemplateButton = (
    <button
      type="button"
      onClick={createTemplate}
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
        NEW TEMPLATE
      </span>
    </button>
  );

  if (groups.length === 0) {
    return (
      <PageShell title="Workout Template" showBack>
        <EmptyState
          message="No template saved"
          description="BUILD ONE HERE, OR SAVE ANY WORKOUT AS A TEMPLATE"
          action={<div className="w-full">{newTemplateButton}</div>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell title="Workout Template" showBack>
      <div className="flex flex-col gap-4">
        <p className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {String(groups.length).padStart(2, '0')} TEMPLATE{groups.length === 1 ? '' : 'S'} · DRAG TO REORDER
        </p>

        <ul className="flex flex-col gap-2">
          {groups.map((g, index) => {
            const names = g.exerciseIds
              .map((id) => appData.exercises.find((e) => e.id === id)?.name)
              .filter(Boolean) as string[];
            const preview = names.slice(0, 3).join(', ');
            const rest = names.length - 3;
            const isDragging = draggingId === g.id;

            return (
              <li
                key={g.id}
                ref={registerItem(g.id)}
                className="card relative"
                style={{
                  border: `1px solid ${isDragging ? 'var(--color-volt)' : 'var(--color-line)'}`,
                  transition: 'border-color 150ms ease',
                }}
              >
                <div className="flex items-stretch" style={{ minHeight: '68px' }}>
                  <button
                    type="button"
                    aria-label={`Drag to reorder ${g.name}`}
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: '32px',
                      color: isDragging ? 'var(--color-text)' : 'var(--color-text-faint)',
                      borderRight: '1px solid var(--color-line)',
                      touchAction: 'none',
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    onPointerDown={handlePointerDown(g.id)}
                    onKeyDown={handleKeyDown(g.id)}
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

                  <button
                    type="button"
                    onClick={() => navigate(`/groups/${g.id}`)}
                    className="flex-1 min-w-0 text-left press flex items-center gap-2.5 px-3 py-3"
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
                    <span className="flex-1 min-w-0">
                      <span
                        className="font-display block truncate"
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
                        className="caps-tight text-[9px] block truncate mt-0.5"
                        style={{ color: 'var(--color-text-faint)' }}
                      >
                        {names.length === 0
                          ? 'EMPTY — TAP TO ADD EXERCISES'
                          : `${String(names.length).padStart(2, '0')} · ${preview}${rest > 0 ? ` +${rest}` : ''}`}
                      </span>
                    </span>
                    <span
                      className="shrink-0 text-[11px]"
                      style={{ color: 'var(--color-text-faint)' }}
                      aria-hidden
                    >
                      →
                    </span>
                  </button>

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
    </PageShell>
  );
}
