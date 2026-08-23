import { useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import ExerciseEditSheet from '../components/shared/ExerciseEditSheet';
import ExerciseThumb from '../components/shared/ExerciseThumb';
import { useAppContext } from '../context/AppContext';
import { useMaybeAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/admin';
import { imageForExercise } from '../utils/exerciseImage';
import { BODY_PART_LABELS, BODY_PART_ACCENT } from '../utils/bodyParts';
import { saveLibraryOverrides, uploadExerciseImage, describeFailure } from '../utils/remoteLibrary';
import type { Exercise } from '../types';

type Filter = 'all' | 'no-image';

/**
 * Corrections to the shipped library, for everyone.
 *
 * The library itself ships with the app, so this is the layer that lets it be
 * fixed without a deploy. Everything written here lands in one document that
 * every app reads at startup.
 */
export default function AdminLibraryPage() {
  const { appData, libraryImages, libraryOverrides, reloadLibrary, showToast } = useAppContext();
  const auth = useMaybeAuth();
  const allowed = isAdmin(auth?.user?.uid);

  const [filter, setFilter] = useState<Filter>('no-image');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    const lower = query.trim().toLowerCase();
    return appData.exercises
      .filter((e) => !e.isCustom)
      .filter((e) => (filter === 'no-image' ? !imageForExercise(e.id, libraryImages) : true))
      .filter((e) => (lower ? e.name.toLowerCase().includes(lower) : true))
      .slice(0, 60);
  }, [appData.exercises, libraryImages, filter, query]);

  const withoutImage = appData.exercises.filter(
    (e) => !e.isCustom && !imageForExercise(e.id, libraryImages),
  ).length;

  if (!allowed) {
    return (
      <PageShell title="Library" eyebrow="ADMIN" showBack>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          This account can't edit the shared library.
        </p>
      </PageShell>
    );
  }

  async function persist(mutate: (draft: typeof libraryOverrides) => void, message: string) {
    setBusy(true);
    try {
      const draft = {
        edits: { ...libraryOverrides.edits },
        added: [...libraryOverrides.added],
        removed: [...libraryOverrides.removed],
      };
      mutate(draft);
      await saveLibraryOverrides(draft);
      await reloadLibrary();
      showToast(message);
      setEditing(null);
    } catch (err) {
      console.error('Library edit failed:', err);
      showToast(describeFailure(err, 'Saving'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title="Library" eyebrow="ADMIN · EVERYONE SEES THIS" showBack>
      <div className="flex flex-col gap-4">
        <p className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {appData.exercises.length} EXERCISES · {withoutImage} WITHOUT A PICTURE
        </p>

        <div className="flex gap-2">
          {(['no-image', 'all'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="h-10 px-3 caps-tight text-[10px] press"
              style={{
                borderRadius: 'var(--radius)',
                background: filter === f ? 'var(--color-volt)' : 'transparent',
                color: filter === f ? '#ffffff' : 'var(--color-text)',
                border: `1px solid ${filter === f ? 'var(--color-volt)' : 'var(--color-line-2)'}`,
                fontWeight: 700,
              }}
            >
              {f === 'no-image' ? 'NEEDS A PICTURE' : 'EVERYTHING'}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SEARCH"
          className="w-full h-12 px-3 font-mono outline-none"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-line-2)',
            borderRadius: 'var(--radius)',
            fontSize: '16px',
            color: 'var(--color-text)',
          }}
        />

        <ul className="flex flex-col">
          {shown.map((exercise) => (
            <li key={exercise.id}>
              <button
                type="button"
                onClick={() => setEditing(exercise)}
                className="w-full text-left flex items-center gap-3 py-2.5 press"
                style={{ borderBottom: '1px solid var(--color-line)' }}
              >
                <ExerciseThumb src={imageForExercise(exercise.id, libraryImages)} />
                <span className="flex-1 min-w-0">
                  <span
                    className="block truncate text-[14px]"
                    style={{ color: 'var(--color-text)', fontWeight: 500 }}
                  >
                    {exercise.name}
                  </span>
                  <span
                    className="caps-tight text-[9px]"
                    style={{ color: BODY_PART_ACCENT[exercise.bodyPart] }}
                  >
                    {BODY_PART_LABELS[exercise.bodyPart]}
                  </span>
                </span>
                <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                  →
                </span>
              </button>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="caps-tight text-[10px] py-6 text-center" style={{ color: 'var(--color-text-faint)' }}>
              NOTHING TO SHOW
            </li>
          )}
        </ul>
      </div>

      {editing && (
        <ExerciseEditSheet
          eyebrow={editing.id}
          initial={{
            name: editing.name,
            bodyPart: editing.bodyPart,
            image: imageForExercise(editing.id, libraryImages),
          }}
          busy={busy}
          saveLabel="SAVE FOR EVERYONE →"
          upload={async (file) => {
            try {
              return await uploadExerciseImage(editing.id, file);
            } catch (err) {
              throw new Error(describeFailure(err, 'The upload'));
            }
          }}
          onClose={() => setEditing(null)}
          onSave={({ name, bodyPart, image }) =>
            // Only what actually differs: an override restating the shipped
            // value is noise in a document everyone downloads.
            persist((draft) => {
              draft.edits[editing.id] = {
                ...draft.edits[editing.id],
                ...(name !== editing.name ? { name } : {}),
                ...(bodyPart !== editing.bodyPart ? { bodyPart } : {}),
                ...(image ? { image } : {}),
              };
            }, 'Saved for everyone')
          }
          remove={{
            label: '✕ REMOVE FROM THE LIBRARY',
            eyebrow: 'REMOVE EXERCISE',
            title: `Remove "${editing.name}" for everyone?`,
            message:
              'Anyone who has already logged it keeps their history — this only takes it out of the library.',
            confirmLabel: 'REMOVE →',
            onRemove: () =>
              persist((draft) => {
                if (!draft.removed.includes(editing.id)) draft.removed.push(editing.id);
              }, 'Removed for everyone'),
          }}
        />
      )}
    </PageShell>
  );
}
