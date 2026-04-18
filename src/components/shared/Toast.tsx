import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, onClose, duration = 2500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-14 left-4 right-4 z-50 animate-[slideDown_0.2s_ease-out]">
      <div
        className="flex items-center gap-3 px-3.5 py-3"
        style={{
          background: 'var(--color-ink)',
          border: '1px solid var(--color-volt)',
          borderRadius: '2px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.55)',
        }}
      >
        <span
          className="w-1.5 h-6 shrink-0"
          style={{ background: 'var(--color-volt)' }}
        />
        <span
          className="caps-tight text-[9px]"
          style={{ color: 'var(--color-text)', letterSpacing: '0.14em' }}
        >
          ✓ OK
        </span>
        <span
          className="flex-1 text-[13px]"
          style={{ color: 'var(--color-text)', letterSpacing: '-0.01em' }}
        >
          {message}
        </span>
      </div>
    </div>
  );
}
