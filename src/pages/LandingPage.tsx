import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/shared/Logo';
import SiteHeader from '../components/layout/SiteHeader';

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
              The honest training log for lifters who care about the numbers. Log sets in seconds, watch the
              graph climb, never wonder what you did last Tuesday again.
            </p>
            <div className="flex items-center gap-3 flex-wrap pt-2">
              <button
                type="button"
                onClick={goSignIn}
                className="h-12 px-6 btn-volt press caps-tight text-[11px] inline-flex items-center"
                style={{ borderRadius: '2px' }}
              >
                START TRAINING →
              </button>
              <button
                type="button"
                onClick={goSignIn}
                className="h-12 px-5 btn-ghost press caps-tight text-[11px] inline-flex items-center"
                style={{ borderRadius: '2px' }}
              >
                SIGN IN
              </button>
              <span className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                NO CARD · FREE FOREVER
              </span>
            </div>
          </div>

          {/* hero stat panel */}
          <div className="sm:col-span-5">
            <div
              className="p-5 sm:p-6 space-y-4"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '2px' }}
            >
              <div className="flex items-center justify-between">
                <span className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  THIS MONTH
                </span>
                <span className="caps-tight text-[10px]" style={{ color: 'var(--color-volt-ink)' }}>
                  +12.4%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Metric value="14" label="SETS" />
                <Metric value="100" label="TOP KG" />
                <Metric value="4" label="DAYS" accent />
              </div>
              <div className="h-px" style={{ background: 'var(--color-line)' }} />
              <div className="space-y-1.5">
                <div className="grid grid-cols-7 gap-1">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((l, i) => (
                    <div
                      key={i}
                      className="caps-tight text-[9px] text-center"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {LANDING_CALENDAR.map((cell, i) => (
                    <LandingCalendarCell key={i} {...cell} />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
                  STREAK
                </span>
                <span className="font-mono text-[12px]" style={{ color: 'var(--color-text)' }}>
                  4 DAYS
                </span>
              </div>
            </div>
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
            <Reveal delay={0}>
              <Feature
                code="01"
                title="Log Session"
                desc="Tap, type, done. Last session's numbers prefilled so you only enter what changed."
              />
            </Reveal>
            <Reveal delay={80}>
              <Feature
                code="02"
                title="Log Book"
                desc="Every workout, every set, searchable. Edit history without breaking streaks."
              />
            </Reveal>
            <Reveal delay={160}>
              <Feature
                code="03"
                title="Progress"
                desc="Per-exercise charts. Volume, top set, estimated 1RM — actual signal, not vanity."
              />
            </Reveal>
            <Reveal delay={240}>
              <Feature
                code="04"
                title="Library & Groups"
                desc="Build your exercise library. Group movements into routines you actually run."
              />
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
            <Reveal delay={0}><Row k="NO ADS, NO STREAKS-AS-RANSOM" v="EVER" /></Reveal>
            <Reveal delay={70}><Row k="DATA SYNCS, DATA STAYS YOURS" v="EXPORT ANYTIME" /></Reveal>
            <Reveal delay={140}><Row k="WORKS OFFLINE, SAVES ON RECONNECT" v="PWA" /></Reveal>
            <Reveal delay={210}><Row k="DESIGNED FOR ONE-HANDED LOGGING" v="MID-SET" /></Reveal>
            <Reveal delay={280}><Row k="OPEN PRICING" v="FREE" /></Reveal>
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
                <div className="mt-4 caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
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
          <div className="caps-tight text-[10px] mb-3" style={{ color: 'var(--color-volt-dim)' }}>
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
            Free to start. Sync across devices. Export your data whenever you want it.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={goSignIn}
              className="h-11 px-5 btn-volt press caps-tight text-[11px] inline-flex items-center"
              style={{ borderRadius: '2px' }}
            >
              CREATE ACCOUNT →
            </button>
            <button
              type="button"
              onClick={goSignIn}
              className="h-11 px-4 press caps-tight text-[11px] inline-flex items-center"
              style={{ border: '1px solid rgba(255,255,255,0.35)', color: 'var(--color-ink)', borderRadius: '2px' }}
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
          <div className="caps-tight text-[10px]" style={{ color: 'var(--color-text-faint)' }}>
            © 2026 LIFTGAUGE · BUILT FOR LIFTERS · BUILT BY RUITAN EXPERIENCE DESIGN
          </div>
          <button
            type="button"
            onClick={goSignIn}
            className="caps-tight text-[10px] press"
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

function Metric({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className="flex items-baseline gap-1">
        <div
          className="font-mono"
          style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-volt)', letterSpacing: '-0.02em' }}
        >
          {value}
        </div>
        {accent && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-volt)"
            strokeWidth={2.5}
            strokeLinecap="square"
            strokeLinejoin="miter"
            style={{ width: '0.85rem', height: '0.85rem', flexShrink: 0 }}
            aria-hidden
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        )}
      </div>
      <div className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
        {label}
      </div>
    </div>
  );
}

interface LandingCell {
  day: number | null;
  trained?: boolean;
  today?: boolean;
  past?: boolean;
}

const LANDING_CALENDAR: LandingCell[] = [
  { day: null }, { day: null },
  { day: 1, past: true }, { day: 2, past: true }, { day: 3, past: true }, { day: 4, past: true }, { day: 5, past: true },
  { day: 6, past: true }, { day: 7, past: true }, { day: 8, past: true }, { day: 9, past: true }, { day: 10, past: true }, { day: 11, past: true }, { day: 12, past: true },
  { day: 13, past: true }, { day: 14, past: true }, { day: 15, past: true }, { day: 16, trained: true }, { day: 17, trained: true }, { day: 18, trained: true }, { day: 19, trained: true, today: true },
  { day: 20 }, { day: 21 }, { day: 22 }, { day: 23 }, { day: 24 }, { day: 25 }, { day: 26 },
  { day: 27 }, { day: 28 }, { day: 29 }, { day: 30 }, { day: null }, { day: null }, { day: null },
];

function LandingCalendarCell({ day, trained, today, past }: LandingCell) {
  if (day === null) {
    return <div style={{ aspectRatio: '1 / 1' }} />;
  }
  return (
    <div
      className="flex items-center justify-center"
      style={{
        aspectRatio: '1 / 1',
        background: trained ? 'var(--color-volt)' : '#ffffff',
        border: `1px solid ${
          trained
            ? 'var(--color-volt)'
            : today
              ? 'var(--color-text)'
              : 'var(--color-line-2)'
        }`,
        borderRadius: '2px',
        opacity: past ? 0.55 : 1,
      }}
    >
      {trained ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ffffff"
          strokeWidth={2.25}
          strokeLinecap="square"
          strokeLinejoin="miter"
          className="w-4 h-4"
          aria-hidden
        >
          <path d="M6 15l6-6 6 6" />
        </svg>
      ) : (
        <span
          className="font-mono text-[10px] leading-none"
          style={{
            color: past ? 'var(--color-text-faint)' : 'var(--color-text)',
            fontWeight: today ? 700 : 500,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {day}
        </span>
      )}
    </div>
  );
}

function Feature({ code, title, desc }: { code: string; title: string; desc: string }) {
  return (
    <div
      className="p-5 h-full flex flex-col"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: '2px' }}
    >
      <div className="caps-tight text-[10px] mb-6" style={{ color: 'var(--color-volt-ink)' }}>
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
      <span className="caps-tight text-[11px]" style={{ color: 'var(--color-text)' }}>
        {k}
      </span>
      <span className="caps-tight text-[10px]" style={{ color: 'var(--color-volt-ink)' }}>
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
          <span className="caps-tight text-[11px]" style={{ color: 'var(--color-text)' }}>
            {it}
          </span>
        </span>
      ))}
    </div>
  );
}
