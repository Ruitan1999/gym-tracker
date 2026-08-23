import ModalShell from './ModalShell';

interface ConfirmModalProps {
  eyebrow?: string;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  eyebrow = 'CONFIRM',
  title,
  message,
  confirmLabel = 'CONFIRM →',
  cancelLabel = 'CANCEL',
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <ModalShell onDismiss={onClose}>
        <div className="caps-tight text-[9px] mb-2" style={{ color: 'var(--color-text)' }}>
          {eyebrow}
        </div>
        <h3
          className="font-display mb-1"
          style={{
            fontSize: '1.375rem',
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'var(--color-text)',
          }}
        >
          {title}
        </h3>
        {message && (
          <p className="text-[13px] mb-4" style={{ color: 'var(--color-text-muted)' }}>
            {message}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="h-12 btn-ghost press caps-tight text-[11px]"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 press caps-tight text-[11px]"
            style={{
              borderRadius: 'var(--radius)',
              background: destructive ? 'var(--color-rust)' : 'var(--color-volt)',
              color: '#ffffff',
            }}
          >
            {confirmLabel}
          </button>
        </div>
    </ModalShell>
  );
}
