import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Dumbbell, NotebookText, TrendingUp, Settings } from 'lucide-react';

const ICON_SIZE = 22;
const ICON_STROKE = 1.75;

const tabs = [
  {
    to: '/',
    label: 'Log',
    code: '01',
    icon: <Dumbbell size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    to: '/history',
    label: 'Log Book',
    code: '02',
    icon: <NotebookText size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    to: '/progress',
    label: 'Progress',
    code: '03',
    icon: <TrendingUp size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
  {
    to: '/settings',
    label: 'Settings',
    code: '04',
    icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
  },
];

export default function BottomNav() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const isTextField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    const onFocusIn = (e: FocusEvent) => {
      if (isTextField(e.target)) setKeyboardOpen(true);
    };
    const onFocusOut = () => setKeyboardOpen(false);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  if (keyboardOpen) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        paddingBottom: 'var(--safe-bottom)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-line-2)',
      }}
      aria-label="Primary"
    >
      <div className="grid grid-cols-4 w-full max-w-[800px] mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `group relative flex flex-col items-center justify-center gap-1 pt-3 pb-3 min-h-[60px] press ${
                isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* top tick indicator */}
                <span
                  aria-hidden
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] transition-all duration-300"
                  style={{
                    width: isActive ? '38%' : '0%',
                    background: 'var(--color-volt)',
                  }}
                />
                {tab.icon}
                <span
                  className="caps-tight text-[9px]"
                  style={{ letterSpacing: '0.12em' }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
