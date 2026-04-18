import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface PageShellProps {
  title: string;
  eyebrow?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  showBack?: boolean;
  topSlot?: ReactNode;
}

export default function PageShell({ title, eyebrow, rightAction, children, showBack, topSlot }: PageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      {showBack && (
        <header
          className="sticky top-0 z-40 flex flex-col"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid var(--color-line)',
            paddingTop: 'var(--safe-top)',
          }}
        >
          <div className="flex items-center justify-between px-4 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="w-10 h-10 -ml-2 flex items-center justify-center press"
                style={{ color: 'var(--color-text)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="square" className="w-5 h-5">
                  <path d="M15 6l-6 6 6 6" />
                </svg>
              </button>
              <div className="min-w-0">
                {eyebrow && (
                  <div className="caps text-[10px] truncate" style={{ color: 'var(--color-text-faint)' }}>
                    {eyebrow}
                  </div>
                )}
                <h1
                  className="font-display leading-none truncate"
                  style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    fontVariationSettings: '"wdth" 90',
                    color: 'var(--color-text)',
                  }}
                >
                  {title}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">{rightAction}</div>
          </div>
        </header>
      )}

      <main
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: showBack ? undefined : 'var(--safe-top)',
          paddingBottom: 'calc(6rem + var(--safe-bottom))',
        }}
      >
        <div className="px-4 pt-5">
          {!showBack && topSlot}
          {!showBack && (
            <div className="mb-4">
              {eyebrow && (
                <div className="caps text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  {eyebrow}
                </div>
              )}
              <h1
                className="font-display leading-none"
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  fontVariationSettings: '"wdth" 90',
                  color: 'var(--color-text)',
                }}
              >
                {title}
              </h1>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
