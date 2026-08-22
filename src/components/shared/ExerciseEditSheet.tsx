import { useRef, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { BODY_PART_ORDER, BODY_PART_LABELS, BODY_PART_ACCENT } from '../../utils/bodyParts';
import type { BodyPart } from '../../types';

export interface ExerciseDraft {
  name: string;
  bodyPart: BodyPart;
  /** Only set when a picture was uploaded just now. */
  image?: string;
}

interface RemoveAction {
  label: string;
  eyebrow: string;
  title: string;
  message: string;
  confirmLabel: string;
  onRemove: () => void;
}

/**
 * One sheet for describing an exercise — picture, name, muscle group.
 *
 * Adding your own and correcting a shipped one ask for exactly the same three
 * things, so they are the same sheet. What differs is where the picture is
 * uploaded to and who the result belongs to, which the caller supplies.
 */
export default function ExerciseEditSheet({
  eyebrow,
  initial,
  busy,
  saveLabel,
  savingLabel = 'SAVING…',
  upload,
  onClose,
  onSave,
  remove,
}: {
  eyebrow: string;
  initial: { name: string; bodyPart: BodyPart; image: string | null };
  busy: boolean;
  saveLabel: string;
  savingLabel?: string;
  upload: (file: File) => Promise<string>;
  onClose: () => void;
  onSave: (draft: ExerciseDraft) => void;
  remove?: RemoveAction;
}) {
  const [name, setName] = useState(initial.name);
  const [bodyPart, setBodyPart] = useState<BodyPart>(initial.bodyPart);
  const [preview, setPreview] = useState<string | null>(initial.image);
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(file: File) {
    setUploading(true);
    setError('');
    try {
      const url = await upload(file);
      setUploadedUrl(url);
      setPreview(url);
    } catch (err) {
      console.error('Image upload failed:', err);
      setError(err instanceof Error ? err.message : 'The upload failed.');
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
          {eyebrow}
        </div>

        <div className="flex items-center gap-3">
          <SheetThumb src={preview} />
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
            placeholder="Exercise name"
            enterKeyHint="done"
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
              onSave({ name: name.trim(), bodyPart, ...(uploadedUrl ? { image: uploadedUrl } : {}) })
            }
            className="h-12 btn-volt press caps-tight text-[11px] disabled:opacity-40"
            style={{ borderRadius: '2px' }}
          >
            {busy ? savingLabel : saveLabel}
          </button>
        </div>

        {remove && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            disabled={busy}
            className="h-11 press caps-tight text-[10px]"
            style={{ borderRadius: '2px', color: 'var(--color-rust)', border: '1px solid var(--color-rust)' }}
          >
            {remove.label}
          </button>
        )}
      </div>

      {remove && confirmRemove && (
        <ConfirmModal
          eyebrow={remove.eyebrow}
          title={remove.title}
          message={remove.message}
          confirmLabel={remove.confirmLabel}
          cancelLabel="KEEP"
          destructive
          onConfirm={() => {
            setConfirmRemove(false);
            remove.onRemove();
          }}
          onClose={() => setConfirmRemove(false)}
        />
      )}
    </>
  );
}

export function SheetThumb({ src, size = 44 }: { src: string | null; size?: number }) {
  const shared = { width: size, height: size, borderRadius: '2px', background: 'var(--color-line-2)' } as const;
  if (!src) return <span className="shrink-0" style={{ ...shared, opacity: 0.4 }} aria-hidden />;
  return (
    <img src={src} alt="" aria-hidden loading="lazy" className="shrink-0" style={{ ...shared, objectFit: 'cover' }} />
  );
}
