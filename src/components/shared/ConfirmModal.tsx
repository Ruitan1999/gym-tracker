import { createPortal } from 'react-dom';

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
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[60] max-w-md mx-auto p-5"
        style={{
          background: 'var(--color-elev)',
          border: '1px solid var(--color-line-2)',
          borderRadius: '2px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
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
            style={{ borderRadius: '2px' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-12 press caps-tight text-[11px]"
            style={{
              borderRadius: '2px',
              background: destructive ? 'var(--color-rust)' : 'var(--color-volt)',
              color: '#ffffff',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
