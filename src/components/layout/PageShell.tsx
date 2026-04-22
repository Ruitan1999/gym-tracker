import { useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

interface PageShellProps {
  title: string;
  eyebrow?: string;
  rightAction?: ReactNode;
  children: ReactNode;
  showBack?: boolean;
  topSlot?: ReactNode;
  onRefresh?: () => Promise<void>;
  hideTitle?: boolean;
  disableRefresh?: boolean;
}

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

export default function PageShell({ title, eyebrow, rightAction, children, showBack, topSlot, onRefresh, hideTitle, disableRefresh }: PageShellProps) {
  const navigate = useNavigate();
  const { refreshAppData } = useAppContext();
  const mainRef = useRef<HTMLElement | null>(null);
  const startYRef = useRef<number | null>(null);
  const pullingRef = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = onRefresh ?? refreshAppData;

  function onTouchStart(e: React.TouchEvent) {
    if (refreshing) return;
    const el = mainRef.current;
    if (!el || el.scrollTop > 0) {
      startYRef.current = null;
      return;
    }
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (refreshing || startYRef.current == null) return;
    const el = mainRef.current;
    if (!el || el.scrollTop > 0) {
      startYRef.current = null;
      setPull(0);
      return;
    }
    const dy = e.touches[0].clientY - startYRef.current;
    if (dy <= 0) {
      setPull(0);
      return;
    }
    pullingRef.current = true;
    const damped = Math.min(MAX_PULL, dy * 0.5);
    setPull(damped);
  }

  async function onTouchEnd() {
    if (refreshing) return;
    const wasPulling = pullingRef.current;
    const distance = pull;
    startYRef.current = null;
    pullingRef.current = false;
    if (wasPulling && distance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPull(48);
      try {
        await doRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }

  const indicatorOpacity = Math.min(1, pull / PULL_THRESHOLD);
  const ready = pull >= PULL_THRESHOLD;

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
          <div className="flex items-center justify-between px-4 h-14 w-full max-w-[800px] mx-auto">
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
        ref={mainRef}
        className="flex-1 overflow-y-auto relative"
        style={{
          paddingTop: showBack ? undefined : 'var(--safe-top)',
          paddingBottom: 'calc(6rem + var(--safe-bottom))',
          overscrollBehaviorY: disableRefresh ? 'none' : 'contain',
          touchAction: 'pan-y',
        }}
        onTouchStart={disableRefresh ? undefined : onTouchStart}
        onTouchMove={disableRefresh ? undefined : onTouchMove}
        onTouchEnd={disableRefresh ? undefined : onTouchEnd}
        onTouchCancel={disableRefresh ? undefined : onTouchEnd}
      >
        {(pull > 0 || refreshing) && (
          <div
            className="pointer-events-none absolute left-0 right-0 flex items-center justify-center"
            style={{
              top: 0,
              height: `${Math.max(pull, refreshing ? 48 : 0)}px`,
              opacity: indicatorOpacity,
              transition: pull === 0 || refreshing ? 'opacity 0.2s, height 0.2s' : undefined,
              zIndex: 30,
            }}
          >
            <div
              className="caps-tight text-[10px] flex items-center gap-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <span
                className="inline-block"
                style={{
                  width: 14,
                  height: 14,
                  border: '1.5px solid var(--color-text-muted)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: refreshing ? 'spin 0.8s linear infinite' : undefined,
                  transform: refreshing ? undefined : `rotate(${Math.min(360, (pull / PULL_THRESHOLD) * 360)}deg)`,
                }}
              />
              {refreshing ? 'REFRESHING' : ready ? 'RELEASE TO REFRESH' : 'PULL TO REFRESH'}
            </div>
          </div>
        )}
        <div
          className="px-4 pt-5 w-full max-w-[800px] mx-auto"
          style={
            disableRefresh
              ? undefined
              : {
                  transform: pull > 0 || refreshing ? `translateY(${Math.max(pull, refreshing ? 48 : 0)}px)` : undefined,
                  transition: pull === 0 && !refreshing ? 'transform 0.2s' : undefined,
                }
          }
        >
          {!showBack && topSlot}
          {!showBack && !hideTitle && (
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
