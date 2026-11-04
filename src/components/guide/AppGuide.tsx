import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Check,
  Dumbbell,
  Flame,
  NotebookText,
  Play,
  Settings,
  TrendingUp,
} from 'lucide-react';
import Logo from '../shared/Logo';
import QuickRepChips from '../workout/QuickRepChips';
import WeightStepper from '../workout/WeightStepper';
import { prefersReducedMotion } from '../../utils/motion';

interface Step {
  title: string;
  body: string;
  art: ReactNode;
}

const ICON = { size: 20, strokeWidth: 2 } as const;

/** A small framed piece of the real screen, so each step shows where to look. */
function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      className="w-full p-3"
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-line-2)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(10, 10, 10, 0.06)',
      }}
    >
      {children}
    </div>
  );
}

function Caps({ children, color = 'var(--color-text-muted)' }: { children: ReactNode; color?: string }) {
  return (
    <span className="block caps-tight" style={{ color }}>
      {children}
    </span>
  );
}

function Name({ children }: { children: ReactNode }) {
  return (
    <span
      className="block font-display"
      style={{ fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)' }}
    >
      {children}
    </span>
  );
}

function Badge({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      aria-hidden
      className="shrink-0 flex items-center justify-center"
      style={{ width: 40, height: 40, borderRadius: 10, background: color, color: '#ffffff' }}
    >
      {children}
    </span>
  );
}

const WEEK = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

function PlanArt() {
  return (
    <Frame>
      <Caps>PLAN</Caps>
      {[
        { name: 'Push day', days: 'MON · THU' },
        { name: 'Pull day', days: 'TUE · FRI' },
      ].map((t) => (
        <div
          key={t.name}
          className="flex items-center gap-3 mt-2 p-2.5"
          style={{ background: 'var(--color-elev)', borderRadius: 'var(--radius)' }}
        >
          <Badge color="var(--color-volt)">
            <Dumbbell {...ICON} />
          </Badge>
          <span className="flex-1 min-w-0">
            <Name>{t.name}</Name>
            <span className="block font-mono text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
              5 exercises · {t.days}
            </span>
          </span>
        </div>
      ))}
    </Frame>
  );
}

function HomeArt() {
  return (
    <Frame>
      <div className="grid grid-cols-7 text-center">
        {WEEK.map((d, i) => (
          <span key={d} className="flex flex-col items-center gap-1">
            <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
              {d}
            </span>
            <span
              className="font-mono flex items-center justify-center"
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                fontSize: 14,
                background: i === 2 ? 'var(--color-volt)' : 'transparent',
                color: i === 2 ? '#ffffff' : 'var(--color-text)',
              }}
            >
              {i + 3}
            </span>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: i < 2 ? 'var(--color-done)' : 'transparent',
              }}
            />
          </span>
        ))}
      </div>
      <div
        className="flex items-center gap-3 mt-3 p-2.5"
        style={{ background: 'var(--color-volt-wash)', borderRadius: 'var(--radius)' }}
      >
        <Badge color="var(--color-volt)">
          <Dumbbell {...ICON} />
        </Badge>
        <span className="flex-1 min-w-0">
          <Caps>TODAY · WE</Caps>
          <Name>Push day</Name>
        </span>
      </div>
    </Frame>
  );
}

function StartArt() {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        aria-hidden
        className="flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          background: 'var(--color-volt)',
          color: '#ffffff',
          boxShadow: '0 10px 28px rgba(23, 87, 214, 0.35)',
        }}
      >
        <Play size={30} strokeWidth={2} fill="currentColor" />
      </span>
      <span className="caps-tight" style={{ color: 'var(--color-text)' }}>
        START
      </span>
    </div>
  );
}

/** The real rep chips and load stepper, to try before the first workout. */
function LogArt() {
  const [reps, setReps] = useState<number | ''>('');
  const [kg, setKg] = useState<number | ''>(20);
  return (
    <Frame>
      <div className="flex items-end gap-6 mb-3">
        <span>
          <Caps color="var(--color-text-faint)">REPS</Caps>
          <span className="block font-mono leading-none mt-1" style={{ fontSize: '2rem', color: 'var(--color-text)' }}>
            {reps === '' ? '—' : reps}
          </span>
        </span>
        <span>
          <Caps color="var(--color-text-faint)">LOAD KG</Caps>
          <span className="block font-mono leading-none mt-1" style={{ fontSize: '2rem', color: 'var(--color-volt)' }}>
            {kg === '' ? '—' : kg}
          </span>
        </span>
      </div>
      <QuickRepChips values={[8, 10, 12]} current={reps} onPick={setReps} />
      <div className="mt-2">
        <WeightStepper value={kg} onChange={setKg} step={2.5} unit="kg" />
      </div>
    </Frame>
  );
}

function CompleteArt() {
  return (
    <Frame>
      <div
        className="flex items-center gap-3 p-2.5"
        style={{
          background: 'var(--color-done-tint)',
          borderRadius: 'var(--radius)',
          borderLeft: '3px solid var(--color-done)',
        }}
      >
        <Badge color="var(--color-done)">
          <Check {...ICON} />
        </Badge>
        <span className="flex-1 min-w-0">
          <Name>Bench Press</Name>
          <Caps color="var(--color-done-deep)">DONE</Caps>
        </span>
      </div>
      <div
        className="mt-2 h-12 flex items-center justify-center caps-tight"
        style={{ background: 'var(--color-volt)', color: '#ffffff', borderRadius: 'var(--radius)' }}
      >
        SAVE SESSION →
      </div>
    </Frame>
  );
}

function TrackArt() {
  return (
    <Frame>
      {[
        { icon: <NotebookText {...ICON} />, label: 'LOG BOOK', text: 'Every session you saved' },
        { icon: <TrendingUp {...ICON} />, label: 'STATS', text: 'Each lift over time' },
        { icon: <Flame {...ICON} />, label: 'HOME', text: 'Your streak and muscles worked' },
      ].map((r, i) => (
        <div key={r.label} className={`flex items-center gap-3 ${i ? 'mt-2.5' : ''}`}>
          <Badge color="var(--color-text)">{r.icon}</Badge>
          <span className="min-w-0">
            <Caps>{r.label}</Caps>
            <span className="block text-[14px]" style={{ color: 'var(--color-text)' }}>
              {r.text}
            </span>
          </span>
        </div>
      ))}
    </Frame>
  );
}

function SettingsArt() {
  return (
    <Frame>
      <div className="flex items-center gap-3 mb-2">
        <Badge color="var(--color-text)">
          <Settings {...ICON} />
        </Badge>
        <Name>Settings</Name>
      </div>
      {['Rep buttons', 'Load step', 'Rest timer', 'Fill from last session'].map((t) => (
        <div
          key={t}
          className="flex items-center justify-between py-2"
          style={{ borderTop: '1px solid var(--color-line)' }}
        >
          <span className="text-[14px]" style={{ color: 'var(--color-text)' }}>
            {t}
          </span>
          <span aria-hidden style={{ color: 'var(--color-text-faint)' }}>
            ›
          </span>
        </div>
      ))}
    </Frame>
  );
}

export const GUIDE_STEPS: Step[] = [
  {
    title: 'Welcome to LiftGauge',
    body: 'A quick look at how it works. It takes about a minute, and you can skip it at any time.',
    art: (
      <div className="w-full flex justify-center" style={{ transform: 'scale(1.6)' }}>
        <Logo withWordmark />
      </div>
    ),
  },
  {
    title: 'Plan your workouts',
    body: 'In Plan, make a template for each workout: give it a name, add its exercises and pick the days you train it. Or choose Rotation to take them in turn.',
    art: <PlanArt />,
  },
  {
    title: 'Home shows your week',
    body: "The days you trained get a dot. Below them is today's workout. Tap it to begin.",
    art: <HomeArt />,
  },
  {
    title: 'Or press Start',
    body: "The big button in the middle of the bar starts today's workout, or picks up the one you left.",
    art: <StartArt />,
  },
  {
    title: 'Log each set',
    body: 'Tap a rep number, or + to type your own. Set the weight with − and +, or tap it to type. Try it here.',
    art: <LogArt />,
  },
  {
    title: 'Finish and save',
    body: 'When an exercise is done, tap Complete exercise and the next one opens. Once they are all done, Save session.',
    art: <CompleteArt />,
  },
  {
    title: 'Watch yourself improve',
    body: 'Saved sessions go in the Log Book. Stats shows how each lift is going, and Home keeps your streak.',
    art: <TrackArt />,
  },
  {
    title: 'Make it yours',
    body: 'The gear on Home opens Settings: your rep buttons, the weight step, a rest timer between sets, and filling in last time’s numbers. This guide is there too.',
    art: <SettingsArt />,
  },
];

/**
 * A click-through guide for someone new. It covers the whole screen, one step
 * at a time, and ends by pointing at the first thing to do.
 */
export default function AppGuide({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const step = GUIDE_STEPS[index];
  const last = index === GUIDE_STEPS.length - 1;
  const motion = !prefersReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(GUIDE_STEPS.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function finish(toPlan: boolean) {
    onDone();
    if (toPlan) navigate('/groups');
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How LiftGauge works"
      className="fixed inset-0 z-[70] flex flex-col"
      style={{
        background: 'var(--color-bg)',
        paddingTop: 'var(--safe-top)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <span className="caps-tight" style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {index + 1} / {GUIDE_STEPS.length}
        </span>
        {!last && (
          <button
            type="button"
            onClick={() => finish(false)}
            className="caps-tight press h-12 px-3"
            style={{ color: 'var(--color-text)' }}
          >
            Skip
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5">
        <div
          key={index}
          className="max-w-md min-h-full mx-auto flex flex-col justify-center gap-6 py-6"
          style={{ animation: motion ? 'guideIn 220ms ease-out' : undefined }}
        >
          <div className="flex items-center">{step.art}</div>
          <div>
            <h2
              className="font-display"
              style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: 'var(--color-text)' }}
            >
              {step.title}
            </h2>
            <p className="mt-3" style={{ fontSize: '16px', lineHeight: 1.5, color: 'var(--color-text-muted)' }}>
              {step.body}
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-5 pb-4 pt-2 max-w-md w-full mx-auto">
        <div className="flex justify-center gap-1.5 mb-4" aria-hidden>
          {GUIDE_STEPS.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === index ? 'var(--color-volt)' : 'var(--color-line-3)',
                transition: motion ? 'width 200ms ease' : undefined,
              }}
            />
          ))}
        </div>
        {last ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => finish(true)}
              className="btn-volt press h-14 w-full flex items-center justify-center gap-2"
              style={{ borderRadius: 'var(--radius)', fontSize: '16px', fontWeight: 700 }}
            >
              <CalendarDays size={18} strokeWidth={2} aria-hidden />
              Make my first template
            </button>
            <button
              type="button"
              onClick={() => finish(false)}
              className="btn-ghost press h-12 w-full"
              style={{ borderRadius: 'var(--radius)', fontSize: '15px', fontWeight: 600 }}
            >
              I’ll look around first
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex(index - 1)}
                className="btn-ghost press h-14 px-5"
                style={{ borderRadius: 'var(--radius)', fontSize: '16px', fontWeight: 600 }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={() => setIndex(index + 1)}
              className="btn-volt press h-14 flex-1"
              style={{ borderRadius: 'var(--radius)', fontSize: '16px', fontWeight: 700 }}
            >
              {index === 0 ? 'Show me' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
