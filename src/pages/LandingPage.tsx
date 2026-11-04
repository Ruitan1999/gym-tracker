import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus } from 'lucide-react';
import MuscleFigure from '../components/progress/MuscleFigure';
import { balancePaint } from '../components/progress/balancePaint';
import { exerciseImageUrl } from '../utils/exerciseImage';
import type { BodyPart } from '../types';
import './landing.css';

/*
 * The public website. The idea: a set is two numbers, reps and weight, and
 * those two numbers are the hero, large, and the visitor can change them.
 * Every picture is the real app (screenshots of an example account) or the
 * app's own exercise illustrations.
 */

/** Adds `is-in` to each [data-reveal] block once it is most of the way up the screen. */
function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const blocks = [...el.querySelectorAll<HTMLElement>('[data-reveal]')];
    if (typeof IntersectionObserver === 'undefined') {
      blocks.forEach((b) => b.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );
    blocks.forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [root]);
}

/** A number whose digits roll to their value, like a counter. */
function Roll({ value }: { value: string }) {
  let digit = 0;
  return (
    <span className="lp-roll" aria-hidden>
      {[...value].map((ch, i) => {
        if (!/\d/.test(ch)) return <span key={`c${i}`}>{ch}</span>;
        const n = Number(ch);
        const order = digit++;
        return (
          <span key={`d${i}`} className="lp-roll__d">
            <span
              className="lp-roll__col"
              style={{ transform: `translateY(${-n}em)`, ['--i' as string]: order }}
            >
              {Array.from({ length: 10 }, (_, k) => (
                <span key={k}>{k}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function kgText(kg: number) {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

const REP_CHOICES = [6, 8, 10, 12];
const LAST = { reps: 10, kg: 92.5 };

/** The live thing: the app's set controls, working, driving the big numbers. */
function LiveSet() {
  // Opens on zeros and rolls up to the set, once, as the page arrives.
  const [reps, setReps] = useState(0);
  const [kg, setKg] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => {
      setReps(8);
      setKg(90);
    }, 450);
    return () => clearTimeout(id);
  }, []);

  const pill = (active: boolean) =>
    `h-12 min-w-12 px-4 rounded-full font-bold text-[1.05rem] transition-colors duration-150 active:scale-95 ${
      active ? 'bg-[#1458cc] text-white' : 'bg-[#ebebe9] text-[#0a0a0a] hover:bg-[#dedfdc]'
    }`;

  return (
    <div className="lp-set lp-load" style={{ ['--i' as string]: 3 }} data-ui>
      <p className="font-bold text-[1.05rem]">Squat, set 2</p>
      <p className="lp-set__figure mt-3" aria-live="polite">
        <span className="sr-only">
          {reps} reps at {kgText(kg)} kilograms
        </span>
        <Roll value={String(reps)} />
        <span className="lp-set__x" aria-hidden>
          ×
        </span>
        <span className="lp-set__kg" aria-hidden>
          <Roll value={kgText(kg)} />
        </span>
        <span className="lp-set__unit" aria-hidden>
          kg
        </span>
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Reps">
        {REP_CHOICES.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={reps === n}
            aria-label={`${n} reps`}
            onClick={() => setReps(n)}
            className={pill(reps === n)}
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          aria-label="2.5 kilograms less"
          onClick={() => setKg((k) => Math.max(0, k - 2.5))}
          className={`${pill(false)} w-12 px-0 flex items-center justify-center`}
        >
          <Minus size={20} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="2.5 kilograms more"
          onClick={() => setKg((k) => Math.min(500, k + 2.5))}
          className={`${pill(true)} w-12 px-0 flex items-center justify-center`}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={() => {
            setReps(LAST.reps);
            setKg(LAST.kg);
          }}
          className="ml-auto h-12 px-4 rounded-full text-[0.95rem] font-semibold bg-[#e4ebf8] text-[#0f449e] hover:bg-[#d6e1f5] transition-colors duration-150 active:scale-95"
        >
          Last time: {LAST.reps} × {LAST.kg} kg
        </button>
      </div>
    </div>
  );
}

const LIBRARY = [
  { id: 'ex-push-001', name: 'Bench Press', part: 'Chest' },
  { id: 'ex-legs-001', name: 'Squat', part: 'Legs' },
  { id: 'ex-legs-002', name: 'Deadlift', part: 'Back and legs' },
  { id: 'ex-pull-002', name: 'Pull-up', part: 'Back' },
  { id: 'ex-push-002', name: 'Overhead Press', part: 'Shoulders' },
  { id: 'ex-push-011', name: 'Lateral Raise', part: 'Shoulders' },
  { id: 'ex-pull-001', name: 'Barbell Row', part: 'Back' },
  { id: 'ex-pull-016', name: 'Dumbbell Curl', part: 'Arms' },
  { id: 'ex-push-005', name: 'Tricep Pushdown', part: 'Arms' },
  { id: 'ex-push-003', name: 'Incline Dumbbell Press', part: 'Chest' },
];

const BAND = ['Bench Press', 'Squat', 'Deadlift', 'Pull-up', 'Overhead Press', 'Barbell Row', 'Lateral Raise', 'Dips', 'Lunges'];

// Example numbers for the body map; nobody's real training.
const MAP_SETS: Partial<Record<BodyPart, number>> = { legs: 44, back: 38, chest: 32, arms: 22, shoulders: 18, core: 10 };
const MAP_NAMES: Partial<Record<BodyPart, string>> = {
  legs: 'Legs',
  back: 'Back',
  chest: 'Chest',
  arms: 'Arms',
  shoulders: 'Shoulders',
  core: 'Core',
};
const MAP_ROWS = (Object.entries(MAP_SETS) as [BodyPart, number][]).sort((a, b) => b[1] - a[1]);

const FAQ: [string, string][] = [
  ['Is it really free?', 'Yes. No ads, no paid tier and no card. Everything on this page is in the free app.'],
  ['Do I need an account?', 'You can start as a guest. Sign in with Google or email when you want your log on more than one device.'],
  ['Does it work without signal?', 'Yes. Log a whole session offline and it saves to your account when you are back online.'],
  ['Can I get my data out?', 'Any time, from Settings: a full JSON backup, or a CSV with one row per set for a spreadsheet.'],
  ['Is there a rest timer?', 'If you want one. Turn it on in Settings and pick its length, and a countdown starts after each set.'],
  ['I am new. Where do I start?', 'The app shows a one-minute tour the first time you open it, then takes you to make your first workout.'],
  ['Can I delete my account?', 'Yes, from Settings. It removes your workouts, exercises and settings for good.'],
];

const INSTALL: [string, string[]][] = [
  ['Android', ['Open liftgauge.fit in Chrome.', 'Tap the menu, then Install app.', 'Open it from your home screen.']],
  ['iPhone', ['Open liftgauge.fit in Safari.', 'Tap Share, then Add to Home Screen.', 'Open it from your home screen.']],
];

const LOGGING: [string, string][] = [
  ['Two taps a set.', 'Tap the reps, nudge the weight with minus and plus.'],
  ['Your own numbers too.', 'Tap + and type any rep count, right where you tapped.'],
  ['Last time, on every set.', 'One tap to reuse it, or have it filled in when you start.'],
  ['A rest timer, if you want one.', 'Off unless you turn it on.'],
];

/** A figure that rolls up from zero the first time it scrolls into view. */
function RollIn({ value, prefix = '', suffix = '' }: { value: string; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <b ref={ref}>
      <span className="sr-only">
        {prefix}
        {value}
        {suffix}
      </span>
      <span aria-hidden>
        {prefix}
        <Roll value={shown ? value : value.replace(/\d/g, '0')} />
        {suffix}
      </span>
    </b>
  );
}

/** Stagger position for a [data-r] part, as a style. */
const at = (i: number) => ({ ['--i' as string]: i }) as React.CSSProperties;

function Phone({ src, alt, className = '', i = 0 }: { src: string; alt: string; className?: string; i?: number }) {
  return (
    <div className={`lp-phone ${className}`}>
      <img
        data-open
        style={at(i)}
        className="lp-shot"
        src={src}
        alt={alt}
        width={780}
        height={1688}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}

function Section({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <section id={id} className="lp-section" data-reveal>
      {children}
    </section>
  );
}

export default function LandingPage() {
  const root = useRef<HTMLDivElement | null>(null);
  // The hidden starting states apply only once the page is running, so
  // nothing is ever left invisible; set before paint, so nothing flashes.
  const [motion, setMotion] = useState(false);
  useLayoutEffect(() => setMotion(true), []);
  useReveal(root);

  return (
    <div ref={root} className={`lp min-h-[100dvh] ${motion ? 'lp-motion' : ''}`}>
      <header className="lp-nav">
        <div className="lp-wrap lp-nav__row">
          <Link to="/" className="text-[1.6rem] font-extrabold tracking-[-0.045em] mr-auto" aria-label="LiftGauge home">
            liftgauge<span style={{ color: 'var(--lp-accent)' }}>.</span>
          </Link>
          <nav className="lp-nav__links" aria-label="Sections">
            <a className="lp-link" href="#plan">Plan</a>
            <a className="lp-link" href="#log">Logging</a>
            <a className="lp-link" href="#exercises">Exercises</a>
            <a className="lp-link" href="#stats">Stats</a>
            <a className="lp-link" href="#questions">Questions</a>
          </nav>
          <Link to="/login" className="lp-link hidden sm:inline">
            Sign in
          </Link>
          <Link to="/login" className="lp-btn">
            Start free
          </Link>
        </div>
      </header>

      <main>
        {/* Hero: what it is, one action, and the set you can change. */}
        <div className="lp-wrap lp-hero">
          <div>
            <h1 className="lp-h1">
              <span className="lp-line">
                <span style={at(0)}>The gym log</span>
              </span>
              <span className="lp-line">
                <span style={at(1)}>that remembers.</span>
              </span>
            </h1>
            <p className="lp-lead mt-8 lp-load" style={at(0)}>
              Plan your week, log each set in two taps, and see every muscle you trained. Free, with no ads.
            </p>
            <div className="mt-8 flex items-center gap-6 flex-wrap lp-load" style={at(1)}>
              <Link to="/login" className="lp-btn">
                Start logging free <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
              </Link>
              <Link to="/login" className="lp-link">
                I have an account
              </Link>
            </div>
          </div>
          <LiveSet />
        </div>

        <Section id="plan">
          <div className="lp-wrap lp-split">
            <div>
              <h2 className="lp-h2" data-r style={at(0)}>
                Your week, already planned.
              </h2>
              <p className="lp-body mt-6" data-r style={at(1)}>
                Make a workout once: its exercises and the days you train it. Home opens on the one that is due today,
                with your week across the top and a dot for every day you trained.
              </p>
              <p className="lp-body mt-4" data-r style={at(2)}>
                Rather train when you can? Switch to rotation and your workouts take turns, so the next one is always
                lined up.
              </p>
            </div>
            <div className="lp-stage">
              <Phone
                src="/assets/site/app-home-v1.webp"
                alt="LiftGauge home: this week, the next workout, a 25 week streak and the muscles trained"
                className="lp-drift"
              />
              <Phone
                src="/assets/site/app-plan-v1.webp"
                alt="The Plan screen: three workouts taking turns in a rotation"
                className="lp-phone--low lp-drift lp-drift--slow"
                i={1}
              />
            </div>
          </div>
        </Section>

        <Section id="log">
          <div className="lp-wrap lp-split lp-split--flip">
            <div>
              <h2 className="lp-h2" data-r style={at(0)}>
                Logging that keeps up.
              </h2>
              <ul className="lp-list">
                {LOGGING.map(([b, t], i) => (
                  <li key={b} data-r style={at(i + 1)}>
                    <strong>{b}</strong> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lp-stage lp-stage--one">
              <Phone
                src="/assets/site/app-workout-v1.webp"
                alt="A workout in progress: squat, 10 reps at 92.5 kg, with the last session's numbers under the set"
                className="lp-drift"
              />
            </div>
          </div>
        </Section>

        <div className="lp-band" aria-hidden>
          <div className="lp-band__track lp-band__track--scroll">
            {[...BAND, ...BAND].map((n, i) => (
              <span key={i}>{n}</span>
            ))}
          </div>
        </div>

        <section id="exercises" className="lp-section" data-reveal style={{ paddingTop: 'clamp(48px, 6vw, 96px)' }}>
          <div className="lp-wrap">
            <h2 className="lp-h2" data-r>
              1,400 exercises, every one drawn.
            </h2>
            <p className="lp-body mt-6" data-r style={at(1)}>
              Search by name or muscle, or add your own. The pictures are kept on your phone, so they show at once,
              even with no signal in the basement gym.
            </p>
          </div>
          <div className="lp-row mt-10" tabIndex={0} aria-label="Some of the exercises, scroll sideways for more">
            {LIBRARY.map((ex, i) => (
              <figure key={ex.id} className="lp-ex" data-r style={at(Math.min(i, 5) + 2)}>
                <img
                  src={exerciseImageUrl(ex.id) ?? undefined}
                  alt={ex.name}
                  loading="lazy"
                  decoding="async"
                  width={240}
                  height={240}
                />
                <figcaption>
                  <span className="lp-ex__name">{ex.name}</span>
                  <span className="lp-ex__part">{ex.part}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* The page's one field of colour. */}
        <section className="lp-field" data-reveal>
          <div className="lp-wrap lp-split">
            <div>
              <h2 className="lp-h2" data-r>
                See what you trained.
              </h2>
              <p className="lp-body mt-6" data-r style={at(1)}>
                Every set lands on a body map. Home shows the last 30 days at a glance, so the muscle you have been
                skipping stands out.
              </p>
            </div>
            <div className="lp-map" data-r style={at(2)} data-ui>
              <p className="font-bold text-[1.05rem] mb-4">Muscle groups, last 30 days</p>
              <div className="flex flex-wrap justify-center items-start gap-6">
                <MuscleFigure
                  paint={balancePaint(MAP_SETS)}
                  description={`Example: ${MAP_ROWS.map(([p, n]) => `${MAP_NAMES[p]} ${n} sets`).join(', ')}`}
                />
                <ul className="flex-1 min-w-[150px] flex flex-col gap-2" aria-hidden>
                  {MAP_ROWS.map(([p, n]) => (
                    <li key={p} className="flex justify-between text-[1.05rem]">
                      <span className="font-semibold">{MAP_NAMES[p]}</span>
                      <span>{n} sets</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <Section id="stats">
          <div className="lp-wrap lp-split lp-split--flip">
            <div>
              <h2 className="lp-h2" data-r>
                Watch the line go up.
              </h2>
              <p className="lp-body mt-6" data-r style={at(1)}>
                Every exercise gets its own chart: your best weight, total volume and every session. A year-long
                calendar shows each day you trained.
              </p>
              <div className="lp-figures">
                <div className="lp-figure" data-r style={at(2)}>
                  <RollIn prefix="+" value="20" suffix=" kg" />
                  <span className="lp-small">on bench press in 24 weeks</span>
                </div>
                <div className="lp-figure" data-r style={at(3)}>
                  <RollIn value="25" />
                  <span className="lp-small">weeks in a row trained</span>
                </div>
              </div>
              <p className="lp-small mt-3" data-r style={at(4)}>
                From an example account.
              </p>
            </div>
            <div className="lp-stage lp-stage--one">
              <Phone
                src="/assets/site/app-stats-v1.webp"
                alt="Bench press stats: best weight rising from 60 to 80 kg over six months"
                className="lp-drift"
              />
            </div>
          </div>
        </Section>

        <Section id="install">
          <div className="lp-wrap">
            <h2 className="lp-h2" data-r>
              On your home screen, no app store.
            </h2>
            <div className="lp-cols">
              {INSTALL.map(([name, steps], i) => (
                <div key={name} className="lp-col" data-r style={at(i + 1)}>
                  <h3>{name}</h3>
                  <ol>
                    {steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section id="questions">
          <div className="lp-wrap lp-qa">
            <h2 className="lp-h2" data-r>
              Questions, answered.
            </h2>
            <div className="lp-faq">
              {FAQ.map(([q, a], i) => (
                <details key={q} data-r style={at(Math.min(i, 5) + 1)}>
                  <summary>
                    {q}
                    <i aria-hidden>
                      <Plus size={18} strokeWidth={2.5} />
                    </i>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </Section>
      </main>

      {/* The close: one last action, then the name at full width. */}
      <footer className="lp-close" data-reveal>
        <div className="lp-wrap">
          <h2 className="lp-h2" style={{ maxWidth: '14ch' }} data-r>
            Your next set starts here.
          </h2>
          <div className="mt-8 flex items-center gap-6 flex-wrap" data-r style={at(1)}>
            <Link to="/login" className="lp-btn">
              Start logging free <ArrowRight size={20} strokeWidth={2.5} aria-hidden />
            </Link>
            <Link to="/login" className="lp-link" style={{ color: 'inherit' }}>
              Sign in
            </Link>
          </div>
          <p className="lp-wordmark" aria-hidden data-r style={at(2)}>
            liftgauge<span>.</span>
          </p>
          <div className="mt-10 flex flex-wrap justify-between gap-3 text-[0.9rem]" style={{ color: '#b5b5b3' }}>
            <span>© 2026 LiftGauge. Built by Ruitan Experience Design.</span>
            <span>Exercise illustrations © Gym visual, gymvisual.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
