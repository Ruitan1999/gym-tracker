import type { ReactNode } from 'react';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
}

export default function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className="w-14 h-14 mb-5 flex items-center justify-center"
        style={{
          border: '1px solid var(--color-line-2)',
          background: 'var(--color-elev)',
          borderRadius: '2px',
          color: 'var(--color-text-faint)',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="square" className="w-6 h-6">
          <path d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      </div>
      <p
        className="font-display mb-6"
        style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: 'var(--color-text)',
        }}
      >
        {message}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
