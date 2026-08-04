import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export interface ActionSheetItem {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  icon?: ReactNode;
}

interface ActionSheetProps {
  eyebrow?: string;
  title: string;
  items: ActionSheetItem[];
  onClose: () => void;
}

export default function ActionSheet({ eyebrow, title, items, onClose }: ActionSheetProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(5,5,5,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-[60] animate-[slideUp_0.2s_ease-out]"
        role="menu"
        aria-label={title}
        style={{
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-line-2)',
          paddingBottom: 'var(--safe-bottom)',
        }}
      >
        <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid var(--color-line)' }}>
          {eyebrow && (
            <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
              {eyebrow}
            </div>
          )}
          <div
            className="font-display truncate mt-0.5"
            style={{
              fontSize: '1.0625rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'var(--color-text)',
            }}
          >
            {title}
          </div>
        </div>

        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            onClick={item.onSelect}
            className="w-full h-14 px-5 flex items-center gap-3 press caps-tight text-[11px]"
            style={{
              color: item.destructive ? 'var(--color-rust)' : 'var(--color-text)',
              borderBottom: '1px solid var(--color-line)',
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        <button
          type="button"
          onClick={onClose}
          className="w-full h-14 px-5 press caps-tight text-[11px]"
          style={{ color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}
        >
          CANCEL
        </button>
      </div>
    </>,
    document.body,
  );
}
