import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Dumbbell, Flame, Play, Repeat } from 'lucide-react';
import Logo from '../components/shared/Logo';
import SiteHeader from '../components/layout/SiteHeader';
import MuscleFigure from '../components/progress/MuscleFigure';
import PartList from '../components/progress/PartList';
import { balancePaint } from '../components/progress/balancePaint';
import type { BodyPart } from '../types';
import QuickRepChips from '../components/workout/QuickRepChips';
import WeightStepper from '../components/workout/WeightStepper';
import { exerciseImageUrl, MEDIA_ATTRIBUTION } from '../utils/exerciseImage';

// Matches Home and the log book.
const ICON_STROKE = 2;

function Reveal({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ animationDelay: visible && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const goSignIn = () => navigate('/login');

  return (
    <div className="min-h-[100dvh]" style={{ background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <SiteHeader />

      <main className="max-w-[1100px] mx-auto px-5 sm:px-8">
        {/* HERO */}
        <section className="pt-12 sm:pt-20 pb-14 sm:pb-24 grid sm:grid-cols-12 gap-8 sm:gap-10 items-center">
          <div className="sm:col-span-7 space-y-6">
            <h1
              className="font-display"
              style={{
                fontSize: 'clamp(2.5rem, 7vw, 5.25rem)',
                fontWeight: 800,
                letterSpacing: '-0.045em',
                lineHeight: 0.95,
                fontVariationSettings: '"wdth" 92',
              }}
            >
              Track every rep.
              <br />
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.02em' }}>
                See every gain.
              </span>
            </h1>
            <p
              className="max-w-[44ch] text-[15px] sm:text-[17px]"
              style={{ color: 'var(--color-text-muted)', lineHeight: 1.45 }}
            >
              Plan your week, log every set with a tap, and see which muscles you have actually trained. The
              honest training log for lifters who care about the numbers.
            </p>
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={goSignIn}
                className="h-12 px-6 btn-volt press caps-tight inline-flex items-center"
                style={{ borderRadius: 'var(--radius)' }}
              >
                START TRAINING →
              </button>
              <button
                type="button"
                onClick={goSignIn}
                className="h-12 px-5 btn-ghost press caps-tight inline-flex items-center"
                style={{ borderRadius: 'var(--radius)' }}
              >
                SIGN IN
              </button>
              <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
                NO CARD · FREE FOREVER
              </span>
            </div>
          </div>

          {/* A small copy of Home: the week, what's next, the streak. */}
          <div className="sm:col-span-5">
            <HomePreview />
          </div>
        </section>

        {/* MARQUEE */}
        <section
          className="overflow-hidden -mx-5 sm:-mx-8 my-2"
          style={{ borderTop: '1px solid var(--color-line)', borderBottom: '1px solid var(--color-line)' }}
        >
          <div className="marquee flex whitespace-nowrap py-3.5">
            <MarqueeRow />
            <MarqueeRow />
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="pt-16 sm:pt-24">
          <SectionHead eyebrow="HOW IT WORKS" title="Three steps," accent=" then it's habit." />
          <div className="grid sm:grid-cols-3 gap-3">
            {STEPS.map((st, i) => (
              <Reveal key={st.title} delay={i * 80}>
                <div
                  className="p-5 h-full"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
                >
                  <span
                    className="flex items-center justify-center mb-5"
                    style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-volt)', color: '#ffffff' }}
                  >
                    {st.icon}
                  </span>
                  <div className="caps-tight mb-1" style={{ color: 'var(--color-volt-ink)' }}>
                    STEP {i + 1}
                  </div>
                  <h3 className="font-display mb-2" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                    {st.title}
                  </h3>
                  <p className="text-[14px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {st.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="pt-16 sm:pt-24 pb-12">
          <div className="mb-10">
            <div className="caps-tight text-[13px] mb-3" style={{ color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.08em' }}>
              WHAT IT DOES
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                fontVariationSettings: '"wdth" 90',
              }}
            >
              A logbook, a coach, and a memory — all
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic' }}> built for one thumb.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 4) * 80}>
                <Feature code={String(i + 1).padStart(2, '0')} title={f.title} desc={f.desc} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* TRY IT — the real rep chips and weight stepper */}
        <section className="py-12 sm:py-20 grid sm:grid-cols-12 gap-8 sm:gap-10 items-center">
          <div className="sm:col-span-5">
            <SectionHead eyebrow="TRY IT" title="Logging a set," accent=" mid-set, one thumb." />
            <p className="text-[15px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: '44ch' }}>
              These are the real controls from the app. Tap a rep number, or + to type your own. Nudge the
              weight with − and +, or tap it and type. Last session's numbers sit underneath, one tap away.
            </p>
          </div>
          <div className="sm:col-span-7">
            <Reveal>
              <TryLogging />
            </Reveal>
          </div>
        </section>

        {/* LIBRARY — real pictures from the app */}
        <section className="py-12 sm:py-20">
          <SectionHead eyebrow="EXERCISE LIBRARY" title="1,400+ exercises," accent=" every one illustrated." />
          <p className="text-[15px] mb-6" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: '56ch' }}>
            Search by name or muscle and add it to a workout. The pictures are saved on your phone, so they
            show instantly, even with no signal in the gym basement. Add your own exercises too.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {LIBRARY_SAMPLE.map((ex, i) => (
              <Reveal key={ex.id} delay={(i % 4) * 60}>
                <div
                  className="p-3 h-full flex flex-col"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
                >
                  <img
                    src={exerciseImageUrl(ex.id) ?? undefined}
                    alt={ex.name}
                    loading="lazy"
                    className="w-full object-contain"
                    style={{ aspectRatio: '1 / 1' }}
                  />
                  <span className="font-display mt-2" style={{ fontSize: '0.95rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {ex.name}
                  </span>
                  <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
                    {ex.part}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
          {/* The illustrations are licensed; the credit goes wherever they are shown. */}
          <p className="caps-tight mt-3" style={{ color: 'var(--color-text-faint)' }}>
            EXERCISE ILLUSTRATIONS {MEDIA_ATTRIBUTION}
          </p>
        </section>

        {/* MUSCLES — the real body map, with made-up numbers */}
        <section className="py-12 sm:py-20 grid sm:grid-cols-12 gap-8 sm:gap-10 items-center">
          <div className="sm:col-span-5">
            <div className="caps-tight text-[13px] mb-3" style={{ color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.08em' }}>
              MUSCLE BALANCE
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                fontVariationSettings: '"wdth" 90',
              }}
            >
              See what you trained,
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic' }}> and what you skipped.</span>
            </h2>
            <p className="mt-4 text-[15px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: '44ch' }}>
              Every set lands on a body map. Home shows the last 30 days at a glance; Stats lets you
              look back further.
            </p>
          </div>
          <div className="sm:col-span-7">
            <Reveal>
              <div
                className="p-5 sm:p-6"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
              >
                <div className="caps-tight mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  MUSCLE GROUPS · LAST 30 DAYS
                </div>
                <div className="flex flex-wrap justify-center items-start gap-5">
                  <MuscleFigure paint={balancePaint(SAMPLE_SETS)} description={SAMPLE_DESCRIPTION} />
                  <div className="flex-1 min-w-[136px]" aria-hidden>
                    <PartList rows={SAMPLE_ROWS} empty="" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PLAN YOUR WAY */}
        <section className="py-12 sm:py-20">
          <SectionHead eyebrow="PLAN YOUR WAY" title="Fixed days or a rotation," accent=" both work." />
          <div className="grid sm:grid-cols-2 gap-3">
            <Reveal>
              <PlanCard
                icon={<CalendarDays size={20} strokeWidth={ICON_STROKE} />}
                title="Fixed week"
                desc="Push on Monday and Thursday, pull on Tuesday and Friday. Each template has its days, and Home shows the one that's due today."
                rows={[
                  ['MON · THU', 'Push day'],
                  ['TUE · FRI', 'Pull day'],
                  ['SAT', 'Legs'],
                ]}
              />
            </Reveal>
            <Reveal delay={80}>
              <PlanCard
                icon={<Repeat size={20} strokeWidth={ICON_STROKE} />}
                title="Rotation"
                desc="Train when you can. Templates take turns in order: whatever you trained last, the next one is lined up."
                rows={[
                  ['NEXT', 'Upper A'],
                  ['THEN', 'Lower A'],
                  ['THEN', 'Upper B'],
                ]}
              />
            </Reveal>
          </div>
        </section>

        {/* PROGRESS */}
        <section className="py-12 sm:py-20 grid sm:grid-cols-12 gap-8 sm:gap-10 items-center">
          <div className="sm:col-span-5">
            <SectionHead eyebrow="STATS" title="Watch the line" accent=" go up." />
            <p className="text-[15px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5, maxWidth: '44ch' }}>
              Every exercise gets its own chart: total volume, your top set and an estimated one-rep max. A
              year-long calendar shows every day you trained.
            </p>
          </div>
          <div className="sm:col-span-7">
            <Reveal>
              <ProgressChart />
            </Reveal>
          </div>
        </section>

        {/* SPLIT — why */}
        <section className="py-16 sm:py-24 grid sm:grid-cols-12 gap-10 items-start">
          <div className="sm:col-span-5">
            <div className="caps-tight text-[13px] mb-3" style={{ color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.08em' }}>
              WHY
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.05,
                fontVariationSettings: '"wdth" 90',
              }}
            >
              The other apps want
              <br />
              <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic' }}>your attention.</span>
              <br />
              We just want your reps.
            </h2>
          </div>
          <div className="sm:col-span-7 space-y-0">
            {WHY_ROWS.map(([k, v], i) => (
              <Reveal key={k} delay={i * 70}>
                <Row k={k} v={v} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* INSTALL */}
        <section className="py-12 sm:py-20">
          <SectionHead eyebrow="INSTALL" title="On your home screen," accent=" no app store." />
          <div className="grid sm:grid-cols-2 gap-3">
            {INSTALL.map((it) => (
              <Reveal key={it.platform}>
                <div
                  className="p-5 h-full"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
                >
                  <h3 className="font-display mb-3" style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
                    {it.platform}
                  </h3>
                  <ol className="flex flex-col gap-2">
                    {it.steps.map((stp, i) => (
                      <li key={stp} className="flex gap-3 text-[14px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
                        <span className="font-mono shrink-0" style={{ color: 'var(--color-volt-ink)' }}>
                          {i + 1}
                        </span>
                        {stp}
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 sm:py-20">
          <SectionHead eyebrow="QUESTIONS" title="Asked" accent=" and answered." />
          <div>
            {FAQ.map(([q, a]) => (
              <details key={q} className="group" style={{ borderTop: '1px solid var(--color-line)' }}>
                <summary
                  className="flex items-center justify-between gap-4 py-4 cursor-pointer press list-none"
                  style={{ fontSize: '16px', fontWeight: 600 }}
                >
                  {q}
                  <span aria-hidden className="shrink-0 transition-transform group-open:rotate-45" style={{ color: 'var(--color-volt)', fontSize: '1.25rem' }}>
                    +
                  </span>
                </summary>
                <p className="pb-4 text-[15px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.55, maxWidth: '64ch' }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* QUOTE */}
        <section className="py-16 sm:py-24">
          <Reveal>
            <div>
              <div className="caps-tight text-[13px] mb-3" style={{ color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.08em' }}>
                FIELD NOTE
              </div>
              <blockquote
                className="font-display"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  fontWeight: 500,
                  letterSpacing: '-0.025em',
                  lineHeight: 1.15,
                }}
              >
                <span style={{ color: 'var(--color-volt-ink)' }}>“</span>
                You don't need a smarter app. You need an honest one — that remembers
                what you lifted last week, and gets out of the way.
                <span style={{ color: 'var(--color-volt-ink)' }}>”</span>
                <div className="mt-4 caps-tight" style={{ color: 'var(--color-text-faint)' }}>
                  LIFTGAUGE TEAM
                </div>
              </blockquote>
            </div>
          </Reveal>
        </section>

      </main>

      {/* CTA — full width with photo background */}
      <section
        className="mt-12 sm:mt-20 relative isolate overflow-hidden"
        style={{ background: 'var(--color-text)', color: 'var(--color-ink)' }}
      >
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1800&q=80&auto=format&fit=crop"
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover -z-10 ken-burns"
          style={{ opacity: 0.5, transformOrigin: 'center' }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              'linear-gradient(180deg, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.9) 100%)',
          }}
        />

        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-10 sm:py-14 text-center relative">
          <div className="caps-tight mb-3" style={{ color: 'var(--color-volt-dim)' }}>
            ENTER THE LOG
          </div>
          <h2
            className="font-display mx-auto"
            style={{
              fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              maxWidth: '20ch',
            }}
          >
            Your next PR is one
            <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic' }}> tracked set </span>
            away.
          </h2>
          <p
            className="mt-3 mx-auto text-[13px] sm:text-[14px]"
            style={{ color: '#d4d4d4', maxWidth: '52ch', lineHeight: 1.5 }}
          >
            Free. Syncs across your devices. A one-minute tour shows you around on day one.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={goSignIn}
              className="h-12 px-5 btn-volt press caps-tight inline-flex items-center"
              style={{ borderRadius: 'var(--radius)' }}
            >
              CREATE ACCOUNT →
            </button>
            <button
              type="button"
              onClick={goSignIn}
              className="h-12 px-4 press caps-tight inline-flex items-center"
              style={{ border: '1px solid rgba(255,255,255,0.35)', color: 'var(--color-ink)', borderRadius: 'var(--radius)' }}
            >
              SIGN IN
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="mt-4"
        style={{ borderTop: '1px solid var(--color-line)', background: 'var(--color-bg)' }}
      >
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Logo withWordmark />
          </div>
          <div className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            © 2026 LIFTGAUGE · BUILT FOR LIFTERS · BUILT BY RUITAN EXPERIENCE DESIGN
          </div>
          <button
            type="button"
            onClick={goSignIn}
            className="caps-tight press"
            style={{ color: 'var(--color-text)' }}
          >
            SIGN IN →
          </button>
        </div>
        <div style={{ paddingBottom: 'var(--safe-bottom)' }} />
      </footer>
    </div>
  );
}

const STEPS = [
  {
    icon: <CalendarDays size={22} strokeWidth={ICON_STROKE} />,
    title: 'Plan',
    desc: 'Make a template for each workout: its exercises and the days you train it.',
  },
  {
    icon: <Play size={22} strokeWidth={ICON_STROKE} />,
    title: 'Start',
    desc: "Open the app and today's workout is waiting. One tap and you're logging.",
  },
  {
    icon: <Flame size={22} strokeWidth={ICON_STROKE} />,
    title: 'Progress',
    desc: 'Every set feeds your charts, your streak and the body map. Next time, beat last time.',
  },
];

const LIBRARY_SAMPLE = [
  { id: 'ex-push-001', name: 'Bench Press', part: 'CHEST' },
  { id: 'ex-legs-001', name: 'Squat', part: 'LEGS' },
  { id: 'ex-legs-002', name: 'Deadlift', part: 'BACK · LEGS' },
  { id: 'ex-pull-002', name: 'Pull-up', part: 'BACK' },
  { id: 'ex-push-011', name: 'Lateral Raise', part: 'SHOULDERS' },
  { id: 'ex-pull-001', name: 'Barbell Row', part: 'BACK' },
  { id: 'ex-pull-016', name: 'Dumbbell Curl', part: 'ARMS' },
  { id: 'ex-push-002', name: 'Overhead Press', part: 'SHOULDERS' },
];

const INSTALL = [
  {
    platform: 'Android',
    steps: ['Open liftgauge.fit in Chrome.', 'Tap the ⋮ menu, then Install app.', 'Open it from your home screen.'],
  },
  {
    platform: 'iPhone',
    steps: ['Open liftgauge.fit in Safari.', 'Tap Share, then Add to Home Screen.', 'Open it from your home screen.'],
  },
];

const FAQ: [string, string][] = [
  ['Is it really free?', 'Yes. No ads, no paid tier, no card. Everything on this page is in the free app.'],
  [
    'Do I need an account?',
    'You can start as a guest. Sign in with Google or email when you want your log on more than one device.',
  ],
  [
    'Does it work without signal?',
    'Yes. Log a whole session offline; it saves to your account when you are back online.',
  ],
  [
    'Can I get my data out?',
    'Any time, from Settings: a full JSON backup, or a CSV with one row per set for a spreadsheet.',
  ],
  [
    'Is there a rest timer?',
    'If you want one. Turn it on in Settings and pick its length; a countdown starts after each set.',
  ],
  [
    'I am new. Where do I start?',
    'The app shows a one-minute tour the first time you open it, then takes you to make your first template.',
  ],
  ['Can I delete my account?', 'Yes, from Settings. It removes your workouts, exercises and settings for good.'],
];

/** An eyebrow and a two-tone heading, as every section here opens. */
function SectionHead({ eyebrow, title, accent }: { eyebrow: string; title: string; accent: string }) {
  return (
    <div className="mb-6">
      <div className="caps-tight text-[13px] mb-3" style={{ color: 'var(--color-text-faint)', fontWeight: 600, letterSpacing: '0.08em' }}>
        {eyebrow}
      </div>
      <h2
        className="font-display"
        style={{
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          fontWeight: 700,
          letterSpacing: '-0.035em',
          lineHeight: 1.05,
          fontVariationSettings: '"wdth" 90',
        }}
      >
        {title}
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 400, fontStyle: 'italic' }}>{accent}</span>
      </h2>
    </div>
  );
}

function TryLogging() {
  const [reps, setReps] = useState<number | ''>('');
  const [kg, setKg] = useState<number | ''>(60);
  return (
    <div
      className="p-5 sm:p-6"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <img src={exerciseImageUrl('ex-push-001') ?? undefined} alt="" className="w-14 h-14 object-contain" />
        <span>
          <span className="block font-display" style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Bench Press
          </span>
          <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            SET 01
          </span>
        </span>
      </div>
      <div className="flex items-end gap-6 mb-4">
        <span>
          <span className="block caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            REPS
          </span>
          <span className="block font-mono leading-none mt-1" style={{ fontSize: '2.25rem' }}>
            {reps === '' ? '—' : reps}
          </span>
        </span>
        <span>
          <span className="block caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            LOAD KG
          </span>
          <span className="block font-mono leading-none mt-1" style={{ fontSize: '2.25rem', color: 'var(--color-volt)' }}>
            {kg === '' ? '—' : kg}
          </span>
        </span>
      </div>
      <QuickRepChips values={[6, 8, 10, 12]} current={reps} onPick={setReps} />
      <div className="mt-3">
        <WeightStepper value={kg} onChange={setKg} step={2.5} unit="kg" />
      </div>
      <button
        type="button"
        onClick={() => {
          setReps(8);
          setKg(62.5);
        }}
        className="press w-full flex items-center gap-3 py-2 px-3 mt-3"
        style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--radius)' }}
      >
        <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
          LAST
        </span>
        <span className="font-mono text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          8 × 62.5 KG
        </span>
        <span className="caps-tight ml-auto" style={{ color: 'var(--color-text-faint)' }}>
          TAP TO USE →
        </span>
      </button>
    </div>
  );
}

function PlanCard({
  icon,
  title,
  desc,
  rows,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  rows: [string, string][];
}) {
  return (
    <div
      className="p-5 h-full"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className="flex items-center justify-center"
          style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-volt)', color: '#ffffff' }}
        >
          {icon}
        </span>
        <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>
          {title}
        </h3>
      </div>
      <p className="text-[14px] mb-4" style={{ color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        {desc}
      </p>
      {rows.map(([k, v]) => (
        <div
          key={k + v}
          className="flex items-center justify-between py-2.5"
          style={{ borderTop: '1px solid var(--color-line)' }}
        >
          <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
            {k}
          </span>
          <span className="font-display" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

// Example numbers only: twelve weeks of a bench press estimate.
const CHART_POINTS = [80, 81, 82.5, 82, 84, 85, 86.5, 86, 88, 89.5, 90, 92];

function ProgressChart() {
  const w = 320;
  const h = 140;
  const min = 78;
  const max = 94;
  const x = (i: number) => 8 + (i / (CHART_POINTS.length - 1)) * (w - 16);
  const y = (v: number) => h - 8 - ((v - min) / (max - min)) * (h - 16);
  const line = CHART_POINTS.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(CHART_POINTS.length - 1)},${h} L${x(0)},${h} Z`;
  const last = CHART_POINTS[CHART_POINTS.length - 1];
  return (
    <div
      className="p-5 sm:p-6"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <span className="caps-tight" style={{ color: 'var(--color-text-muted)' }}>
          BENCH PRESS · EST. 1RM
        </span>
        <span className="caps-tight" style={{ color: 'var(--color-done-deep)' }}>
          +{(last - CHART_POINTS[0]).toFixed(0)} KG IN 12 WEEKS
        </span>
      </div>
      <div className="font-mono mb-3" style={{ fontSize: '2rem', color: 'var(--color-text)' }}>
        {last} <span className="text-[14px]" style={{ color: 'var(--color-text-faint)' }}>KG</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Example chart of a bench press estimate rising over twelve weeks">
        <path d={area} fill="var(--color-volt-wash)" />
        <path d={line} fill="none" stroke="var(--color-volt)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(CHART_POINTS.length - 1)} cy={y(last)} r={4.5} fill="var(--color-volt)" />
      </svg>
      <div className="flex justify-between caps-tight mt-1" style={{ color: 'var(--color-text-faint)' }}>
        <span>12 WEEKS AGO</span>
        <span>THIS WEEK</span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: 'Plan your week',
    desc: 'Make a template for each workout and pick its days, or let them take turns in a rotation.',
  },
  {
    title: 'Next up, one tap',
    desc: "Home shows this week and today's workout. Tap it, or the Start button, and you're in.",
  },
  {
    title: 'Log in seconds',
    desc: 'Tap a rep number or type your own, nudge the weight with − and +. Last time is one tap away.',
  },
  {
    title: '1,400+ exercises',
    desc: 'Every one illustrated, and the pictures are kept on your phone so they show instantly.',
  },
  {
    title: 'Muscle balance',
    desc: 'A body map of every set from the last 30 days, so nothing gets skipped for long.',
  },
  {
    title: 'Streaks that are fair',
    desc: 'Counted in weeks you trained, not days. A rest day never breaks it.',
  },
  {
    title: 'Log Book',
    desc: 'Every session you saved, set by set. Open one to see it or change it.',
  },
  {
    title: 'Stats',
    desc: 'Per-exercise charts for volume, top set and estimated 1RM, plus a year of training at a glance.',
  },
];

const WHY_ROWS: [string, string][] = [
  ['NO ADS', 'EVER'],
  ['YOUR DATA SYNCS AND STAYS YOURS', 'EXPORT JSON / CSV'],
  ['WORKS OFFLINE, SAVES ON RECONNECT', 'INSTALLABLE'],
  ['REST TIMER ONLY IF YOU WANT ONE', 'OPTIONAL'],
  ['A SHORT TOUR ON YOUR FIRST DAY', 'GUIDED'],
  ['OPEN PRICING', 'FREE'],
];

// Made-up numbers for the body map; nothing here is anyone's real training.
const SAMPLE_SETS: Partial<Record<BodyPart, number>> = {
  chest: 32,
  back: 38,
  legs: 44,
  shoulders: 18,
  arms: 22,
  core: 10,
};
const SAMPLE_ROWS = (Object.entries(SAMPLE_SETS) as [BodyPart, number][])
  .sort((a, b) => b[1] - a[1])
  .map(([part, n]) => ({ part, note: `${n} sets` }));
const SAMPLE_DESCRIPTION = `Example: sets in the last 30 days, ${SAMPLE_ROWS.map((r) => `${r.part} ${r.note}`).join(', ')}`;

const PREVIEW_WEEK = [
  { d: 'MO', n: 3, trained: true },
  { d: 'TU', n: 4, trained: true },
  { d: 'WE', n: 5 },
  { d: 'TH', n: 6, today: true },
  { d: 'FR', n: 7 },
  { d: 'SA', n: 8 },
  { d: 'SU', n: 9 },
];

/** Home in miniature, drawn the way the app draws it. */
function HomePreview() {
  return (
    <div className="flex flex-col gap-3" aria-label="Example of the home screen" role="img">
      <div
        className="p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
      >
        <div className="caps-tight text-center mb-3" style={{ color: 'var(--color-text-muted)' }}>
          THIS WEEK
        </div>
        <div className="grid grid-cols-7 text-center">
          {PREVIEW_WEEK.map((day) => (
            <span key={day.d} className="flex flex-col items-center gap-1.5">
              <span className="caps-tight" style={{ color: 'var(--color-text-faint)' }}>
                {day.d}
              </span>
              <span
                className="font-mono flex items-center justify-center"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  fontSize: 15,
                  background: day.today ? 'var(--color-volt)' : 'transparent',
                  color: day.today ? '#ffffff' : 'var(--color-text)',
                }}
              >
                {day.n}
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: day.trained ? 'var(--color-done)' : 'transparent',
                }}
              />
            </span>
          ))}
        </div>
        <div
          className="flex items-center gap-3 mt-3 p-3"
          style={{ background: 'var(--color-volt-wash)', borderRadius: 'var(--radius)' }}
        >
          <span
            className="shrink-0 flex items-center justify-center"
            style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-volt)', color: '#ffffff' }}
          >
            <Dumbbell size={20} strokeWidth={ICON_STROKE} />
          </span>
          <span className="min-w-0">
            <span className="block caps-tight" style={{ color: 'var(--color-text-muted)' }}>
              NEXT IN ROTATION
            </span>
            <span
              className="block font-display"
              style={{ fontSize: '1.0625rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)' }}
            >
              Push day
            </span>
          </span>
        </div>
      </div>
      <div
        className="flex items-center gap-3 p-4"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '16px' }}
      >
        <Flame size={24} strokeWidth={ICON_STROKE} color="#b8860b" />
        <span className="min-w-0">
          <span
            className="block font-display"
            style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--color-text)' }}
          >
            6 week streak
          </span>
          <span className="block font-mono text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            2 this week · 58 total
          </span>
        </span>
      </div>
    </div>
  );
}

function Feature({ code, title, desc }: { code: string; title: string; desc: string }) {
  return (
    <div
      className="p-5 h-full flex flex-col"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 'var(--radius)' }}
    >
      <div className="caps-tight mb-6" style={{ color: 'var(--color-volt-ink)' }}>
        {code}
      </div>
      <h3
        className="font-display mb-2"
        style={{ fontSize: '1.125rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text)' }}
      >
        {title}
      </h3>
      <p className="text-[13px]" style={{ color: 'var(--color-text-muted)', lineHeight: 1.45 }}>
        {desc}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-4"
      style={{ borderTop: '1px solid var(--color-line)' }}
    >
      <span className="caps-tight" style={{ color: 'var(--color-text)' }}>
        {k}
      </span>
      <span className="caps-tight" style={{ color: 'var(--color-volt-ink)' }}>
        {v}
      </span>
    </div>
  );
}

function MarqueeRow() {
  const items = [
    'BENCH PRESS',
    'BACK SQUAT',
    'DEADLIFT',
    'OVERHEAD PRESS',
    'PULL-UP',
    'ROW',
    'FRONT SQUAT',
    'ROMANIAN DL',
    'INCLINE BENCH',
    'DIP',
    'HIP THRUST',
    'SPLIT SQUAT',
  ];
  return (
    <div className="flex items-center gap-10 px-6 shrink-0">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-3">
          <span
            className="inline-block w-1 h-1"
            style={{ background: 'var(--color-volt)', borderRadius: '999px' }}
          />
          <span className="caps-tight" style={{ color: 'var(--color-text)' }}>
            {it}
          </span>
        </span>
      ))}
    </div>
  );
}
