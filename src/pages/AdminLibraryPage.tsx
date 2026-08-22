import { useMemo, useRef, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import ConfirmModal from '../components/shared/ConfirmModal';
import { useAppContext } from '../context/AppContext';
import { useMaybeAuth } from '../context/AuthContext';
import { isAdmin } from '../utils/admin';
import { imageForExercise } from '../utils/exerciseImage';
import { BODY_PART_ORDER, BODY_PART_LABELS, BODY_PART_ACCENT } from '../utils/bodyParts';
import { saveLibraryOverrides, uploadExerciseImage, describeFailure } from '../utils/remoteLibrary';
import type { BodyPart, Exercise } from '../types';

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
                borderRadius: '2px',
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
            borderRadius: '2px',
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
                <Thumb src={imageForExercise(exercise.id, libraryImages)} />
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
        <EditSheet
          exercise={editing}
          image={imageForExercise(editing.id, libraryImages)}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={(changes) =>
            persist((draft) => {
              draft.edits[editing.id] = { ...draft.edits[editing.id], ...changes };
            }, 'Saved for everyone')
          }
          onRemove={() =>
            persist((draft) => {
              if (!draft.removed.includes(editing.id)) draft.removed.push(editing.id);
            }, 'Removed for everyone')
          }
        />
      )}
    </PageShell>
  );
}

function Thumb({ src }: { src: string | null }) {
  const shared = { width: 44, height: 44, borderRadius: '2px', background: 'var(--color-line-2)' } as const;
  if (!src) return <span className="shrink-0" style={{ ...shared, opacity: 0.4 }} aria-hidden />;
  return (
    <img src={src} alt="" aria-hidden loading="lazy" className="shrink-0" style={{ ...shared, objectFit: 'cover' }} />
  );
}

function EditSheet({
  exercise,
  image,
  busy,
  onClose,
  onSave,
  onRemove,
}: {
  exercise: Exercise;
  image: string | null;
  busy: boolean;
  onClose: () => void;
  onSave: (changes: { name?: string; bodyPart?: BodyPart; image?: string }) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(exercise.name);
  const [bodyPart, setBodyPart] = useState<BodyPart>(exercise.bodyPart);
  const [preview, setPreview] = useState<string | null>(image);
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(file: File) {
    setUploading(true);
    setError('');
    try {
      const url = await uploadExerciseImage(exercise.id, file);
      setUploadedUrl(url);
      setPreview(url);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(describeFailure(err, 'The upload'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60]" style={{ background: 'rgba(5,5,5,0.6)' }} onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-[60] p-5 flex flex-col gap-4 animate-[slideUp_0.2s_ease-out]"
        style={{
          background: 'var(--color-elev)',
          borderTop: '1px solid var(--color-line-2)',
          paddingBottom: 'calc(1.25rem + var(--safe-bottom))',
          maxHeight: '88dvh',
          overflowY: 'auto',
        }}
      >
        <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {exercise.id}
        </div>

        <div className="flex items-center gap-3">
          <Thumb src={preview} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading || busy}
            className="h-10 px-3 caps-tight text-[10px] press"
            style={{
              borderRadius: '2px',
              border: '1px solid var(--color-volt)',
              color: 'var(--color-volt)',
              fontWeight: 700,
            }}
          >
            {uploading ? 'UPLOADING…' : preview ? 'REPLACE PICTURE' : 'ADD PICTURE'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pick(file);
              e.target.value = '';
            }}
          />
        </div>
        {error && (
          <p className="text-[12px]" style={{ color: 'var(--color-rust)' }}>
            {error}
          </p>
        )}

        <div>
          <div className="caps-tight text-[9px] mb-1.5" style={{ color: 'var(--color-text-faint)' }}>
            NAME
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-12 px-3 font-display outline-none"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line-2)',
              borderRadius: '2px',
              fontSize: '16px',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <div>
          <div className="caps-tight text-[9px] mb-1.5" style={{ color: 'var(--color-text-faint)' }}>
            MUSCLE GROUP
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {BODY_PART_ORDER.map((part) => (
              <button
                key={part}
                type="button"
                onClick={() => setBodyPart(part)}
                className="h-10 caps-tight text-[9px] press"
                style={{
                  borderRadius: '2px',
                  background: bodyPart === part ? BODY_PART_ACCENT[part] : 'transparent',
                  color: bodyPart === part ? '#ffffff' : 'var(--color-text)',
                  border: `1px solid ${bodyPart === part ? BODY_PART_ACCENT[part] : 'var(--color-line-2)'}`,
                  fontWeight: 700,
                }}
              >
                {BODY_PART_LABELS[part].slice(0, 5)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 btn-ghost press caps-tight text-[11px]"
            style={{ borderRadius: '2px' }}
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={busy || uploading || !name.trim()}
            onClick={() =>
              onSave({
                ...(name.trim() !== exercise.name ? { name: name.trim() } : {}),
                ...(bodyPart !== exercise.bodyPart ? { bodyPart } : {}),
                ...(uploadedUrl ? { image: uploadedUrl } : {}),
              })
            }
            className="h-12 btn-volt press caps-tight text-[11px] disabled:opacity-40"
            style={{ borderRadius: '2px' }}
          >
            {busy ? 'SAVING…' : 'SAVE FOR EVERYONE →'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setConfirmRemove(true)}
          disabled={busy}
          className="h-11 press caps-tight text-[10px]"
          style={{ borderRadius: '2px', color: 'var(--color-rust)', border: '1px solid var(--color-rust)' }}
        >
          ✕ REMOVE FROM THE LIBRARY
        </button>
      </div>

      {confirmRemove && (
        <ConfirmModal
          eyebrow="REMOVE EXERCISE"
          title={`Remove "${exercise.name}" for everyone?`}
          message="Anyone who has already logged it keeps their history — this only takes it out of the library."
          confirmLabel="REMOVE →"
          cancelLabel="KEEP"
          destructive
          onConfirm={() => {
            setConfirmRemove(false);
            onRemove();
          }}
          onClose={() => setConfirmRemove(false)}
        />
      )}
    </>
  );
}
