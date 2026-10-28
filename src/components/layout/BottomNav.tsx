import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, NotebookText, Play, TrendingUp, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { prepareStart, templateDueToday } from '../../utils/startSession';
import { todayIndex } from '../../utils/schedule';

const ICON_SIZE = 22;
const ICON_STROKE = 1.75;

const leftTabs = [
  {
    to: '/',
    label: 'Log',
    code: '01',
    icon: <Dumbbell size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    prefetch: () => {},
  },
  {
    to: '/history',
    label: 'Log Book',
    code: '02',
    icon: <NotebookText size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    prefetch: () => {},
  },
];

const rightTabs = [
  {
    to: '/progress',
    label: 'Progress',
    code: '03',
    icon: <TrendingUp size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    // The only tab still behind its own chunk — the rest ship in the bundle.
    prefetch: () => {
      import('../../pages/ProgressPage').catch(() => {});
    },
  },
  {
    to: '/settings',
    label: 'Settings',
    code: '04',
    icon: <Settings size={ICON_SIZE} strokeWidth={ICON_STROKE} />,
    prefetch: () => {},
  },
];

type Tab = (typeof leftTabs)[number];

// How far the Start button stands above the bar.
const START_RISE = 20;
const START_SIZE = 56;

export default function BottomNav() {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { appData } = useAppContext();

  function start() {
    const due = templateDueToday(appData.groups ?? [], appData.workouts, todayIndex());
    const { autoOpenSelect } = prepareStart(due, appData.workouts);
    navigate('/workout/new', autoOpenSelect ? { state: { autoOpenSelect: true } } : undefined);
  }

  const TOP_LEVEL_PATHS = ['/', '/history', '/progress', '/settings'];
  const hideOnRoute = !TOP_LEVEL_PATHS.includes(location.pathname);

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

  if (keyboardOpen || hideOnRoute) return null;

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
      <div className="grid grid-cols-5 w-full max-w-[800px] mx-auto">
        {leftTabs.map(renderTab)}
        <StartButton onStart={start} />
        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}

function StartButton({ onStart }: { onStart: () => void }) {
  return (
    <button
      type="button"
      onClick={onStart}
      aria-label="Start workout"
      className="group relative flex flex-col items-center justify-end pb-3 min-h-[60px] text-[var(--color-text)] outline-none"
    >
      <span
        aria-hidden
        className="absolute left-1/2 flex items-center justify-center rounded-full text-white transition-transform duration-100 group-active:scale-95 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-[var(--color-volt)]"
        style={{
          width: START_SIZE,
          height: START_SIZE,
          top: -START_RISE,
          marginLeft: -START_SIZE / 2,
          background: 'var(--color-volt)',
          border: '4px solid var(--color-surface)',
          boxShadow: '0 8px 18px -4px var(--color-volt-glow), 0 2px 6px rgba(0, 0, 0, 0.18)',
        }}
      >
        <Play size={24} strokeWidth={2} fill="currentColor" />
      </span>
      <span className="caps-tight text-[9px]" style={{ letterSpacing: '0.12em' }}>
        Start
      </span>
    </button>
  );
}

function renderTab(tab: Tab) {
  return (
    <NavLink
      key={tab.to}
      to={tab.to}
      end={tab.to === '/'}
      onTouchStart={() => tab.prefetch()}
      onMouseEnter={() => tab.prefetch()}
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
  );
}
