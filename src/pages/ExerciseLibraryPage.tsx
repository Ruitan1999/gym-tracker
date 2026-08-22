import { useMemo, useState } from 'react';
import PageShell from '../components/layout/PageShell';
import ExerciseEditSheet, { SheetThumb } from '../components/shared/ExerciseEditSheet';
import { useAppContext } from '../context/AppContext';
import { useMaybeAuth } from '../context/AuthContext';
import type { BodyPart, Exercise } from '../types';
import { BODY_PART_ORDER, BODY_PART_LABELS, BODY_PART_ACCENT } from '../utils/bodyParts';
import { imageForExercise } from '../utils/exerciseImage';
import { uploadOwnExerciseImage, describeFailure } from '../utils/remoteLibrary';

/** Adding a new one, or changing one already there. */
type Sheet = { mode: 'add'; id: string } | { mode: 'edit'; exercise: Exercise };

export default function ExerciseLibraryPage() {
  const {
    appData,
    addExercise,
    renameExercise,
    updateCustomExercise,
    deleteExercise,
    exerciseImages,
    showToast,
  } = useAppContext();
  const auth = useMaybeAuth();

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  /**
   * Yours first, on their own.
   *
   * An exercise you made up is the only one on this page you can do anything
   * with, and there are a handful of them against a catalog of well over a
   * thousand — buried among the shipped ones they were effectively unfindable.
   */
  const mine = useMemo(
    () =>
      appData.exercises
        .filter((e) => e.isCustom)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [appData.exercises],
  );

  const byBodyPart = useMemo(
    () =>
      BODY_PART_ORDER.map((part) => ({
        part,
        exercises: appData.exercises.filter((e) => !e.isCustom && e.bodyPart === part),
      })),
    [appData.exercises],
  );

  /**
   * Pictures for your own exercises go under your own account. An id is needed
   * before the upload, which is why a new exercise gets one when the sheet
   * opens rather than when it is saved.
   */
  async function upload(exerciseId: string, file: File): Promise<string> {
    const uid = auth?.user?.uid;
    if (!uid) throw new Error('Sign in to add a picture.');
    try {
      return await uploadOwnExerciseImage(uid, exerciseId, file);
    } catch (err) {
      throw new Error(describeFailure(err, 'The upload'));
    }
  }

  function handleSave(name: string, bodyPart: BodyPart, image?: string) {
    if (!sheet) return;
    if (sheet.mode === 'add') {
      addExercise({ id: sheet.id, name, bodyPart, isCustom: true });
      if (image) updateCustomExercise(sheet.id, { image });
      showToast('Exercise added');
    } else {
      const { exercise } = sheet;
      if (name !== exercise.name) renameExercise(exercise.id, name);
      updateCustomExercise(exercise.id, { bodyPart, ...(image ? { image } : {}) });
      showToast('Exercise updated');
    }
    setSheet(null);
  }

  const toggle = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <PageShell title="Exercise Index" eyebrow="LIBRARY CATALOG" showBack>
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => setSheet({ mode: 'add', id: crypto.randomUUID() })}
          className="h-12 btn-volt press caps-tight text-[11px]"
          style={{ borderRadius: '2px' }}
        >
          ＋ ADD CUSTOM EXERCISE
        </button>

        <section>
          <SectionHeader
            marker="✎"
            markerColor="var(--color-volt)"
            label="YOUR EXERCISES"
            count={mine.length}
            open={!collapsed.mine}
            onToggle={() => toggle('mine')}
          />
          {!collapsed.mine &&
            (mine.length > 0 ? (
              <ul>
                {mine.map((exercise, i) => (
                  <li key={exercise.id} style={rowBorder(i)}>
                    <button
                      type="button"
                      onClick={() => setSheet({ mode: 'edit', exercise })}
                      className="w-full text-left flex items-center gap-3 h-14 press"
                    >
                      <Row
                        index={i}
                        name={exercise.name}
                        src={imageForExercise(exercise.id, exerciseImages)}
                        bodyPart={exercise.bodyPart}
                      />
                      <span className="pr-1 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="caps-tight text-[10px] py-4" style={{ color: 'var(--color-text-faint)' }}>
                — NOTHING OF YOUR OWN YET —
              </p>
            ))}
        </section>

        <div className="flex items-center gap-3">
          <span className="flex-1 h-px" style={{ background: 'var(--color-line-2)' }} />
          <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
            COMES WITH THE APP
          </span>
          <span className="flex-1 h-px" style={{ background: 'var(--color-line-2)' }} />
        </div>

        {byBodyPart.map(({ part, exercises }, idx) => (
          <section key={part}>
            <SectionHeader
              marker={String(idx + 1).padStart(2, '0')}
              markerColor={BODY_PART_ACCENT[part]}
              label={BODY_PART_LABELS[part]}
              count={exercises.length}
              open={!collapsed[part]}
              onToggle={() => toggle(part)}
            />
            {!collapsed[part] && exercises.length > 0 && (
              <ul>
                {exercises.map((exercise, i) => (
                  <li key={exercise.id} style={rowBorder(i)}>
                    <div className="flex items-center gap-3 h-14">
                      <Row
                        index={i}
                        name={exercise.name}
                        src={imageForExercise(exercise.id, exerciseImages)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!collapsed[part] && exercises.length === 0 && (
              <p className="caps-tight text-[10px] py-4" style={{ color: 'var(--color-text-faint)' }}>
                — NOTHING HERE —
              </p>
            )}
          </section>
        ))}
      </div>

      {sheet && (
        <ExerciseEditSheet
          eyebrow={sheet.mode === 'add' ? 'NEW EXERCISE' : 'YOUR EXERCISE'}
          initial={
            sheet.mode === 'add'
              ? { name: '', bodyPart: 'chest', image: null }
              : {
                  name: sheet.exercise.name,
                  bodyPart: sheet.exercise.bodyPart,
                  image: imageForExercise(sheet.exercise.id, exerciseImages),
                }
          }
          busy={false}
          saveLabel={sheet.mode === 'add' ? 'ADD TO INDEX →' : 'SAVE →'}
          upload={(file) => upload(sheet.mode === 'add' ? sheet.id : sheet.exercise.id, file)}
          onClose={() => setSheet(null)}
          onSave={({ name, bodyPart, image }) => handleSave(name, bodyPart, image)}
          remove={
            sheet.mode === 'edit'
              ? {
                  label: '✕ DELETE THIS EXERCISE',
                  eyebrow: 'DELETE EXERCISE',
                  title: `Delete "${sheet.exercise.name}"?`,
                  message: 'It goes out of your index. Anything already logged against it stays.',
                  confirmLabel: 'DELETE →',
                  onRemove: () => {
                    const gone = deleteExercise(sheet.exercise.id);
                    showToast(
                      gone
                        ? 'Exercise deleted'
                        : "That's used in a workout you've logged, so it can't be deleted.",
                    );
                    if (gone) setSheet(null);
                  },
                }
              : undefined
          }
        />
      )}
    </PageShell>
  );
}

const rowBorder = (i: number) => ({
  borderTop: i === 0 ? '1px solid var(--color-line)' : undefined,
  borderBottom: '1px solid var(--color-line)',
});

function SectionHeader({
  marker,
  markerColor,
  label,
  count,
  open,
  onToggle,
}: {
  marker: string;
  markerColor: string;
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 mb-3 press">
      <span className="caps text-[10px]" style={{ color: markerColor }}>
        {marker}
      </span>
      <span className="caps text-[10px]" style={{ color: 'var(--color-text)' }}>
        {label}
      </span>
      <span className="flex-1 h-px" style={{ background: 'var(--color-line)' }} />
      <span className="font-mono text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
        {String(count).padStart(2, '0')}
      </span>
      <span className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
        {open ? '▾' : '▸'}
      </span>
    </button>
  );
}

function Row({
  index,
  name,
  src,
  bodyPart,
}: {
  index: number;
  name: string;
  src: string | null;
  bodyPart?: BodyPart;
}) {
  return (
    <>
      <span
        className="font-mono text-[10px] w-8 pl-1 shrink-0"
        style={{ color: 'var(--color-text-faint)' }}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <SheetThumb src={src} size={36} />
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[15px]" style={{ color: 'var(--color-text)' }}>
          {name}
        </span>
        {bodyPart && (
          <span className="caps-tight text-[9px]" style={{ color: BODY_PART_ACCENT[bodyPart] }}>
            {BODY_PART_LABELS[bodyPart]}
          </span>
        )}
      </span>
    </>
  );
}
