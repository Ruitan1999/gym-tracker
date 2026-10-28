import { useCallback, useEffect, useRef, useState } from 'react';

export const DEFAULT_REST_SECONDS = 90;
export const REST_STEP_SECONDS = 15;
const MIN_REST_SECONDS = 15;
const MAX_REST_SECONDS = 600;
/** How long "Go" stays up before the bar tucks itself away. */
export const GO_LINGER_MS = 1600;
export const REST_STORAGE_KEY = 'gym-tracker-rest-seconds';

export type RestPhase = 'idle' | 'running' | 'paused' | 'go';

function clampRest(sec: number): number {
  return Math.min(MAX_REST_SECONDS, Math.max(MIN_REST_SECONDS, Math.round(sec)));
}

/** Last rest length the person settled on; storage can be blocked or empty. */
export function loadRestSeconds(): number {
  try {
    const n = Number(localStorage.getItem(REST_STORAGE_KEY));
    if (Number.isFinite(n) && n > 0) return clampRest(n);
  } catch {
    /* private mode or blocked storage: fall through to the default */
  }
  return DEFAULT_REST_SECONDS;
}

function saveRestSeconds(sec: number) {
  try {
    localStorage.setItem(REST_STORAGE_KEY, String(sec));
  } catch {
    /* remembering is a convenience, never a failure */
  }
}

/**
 * Whole seconds left, rounded up so the display reads 0:01 until the very end
 * rather than showing 0:00 while still counting.
 */
export function remainingSeconds(endAt: number, now: number): number {
  return Math.max(0, Math.ceil((endAt - now) / 1000));
}

interface TimerState {
  phase: RestPhase;
  /** Wall-clock moment the rest ends; only meaningful while running. */
  endAt: number;
  /** Milliseconds left, frozen while paused. */
  pausedMs: number;
  /** Length of this rest, for the progress line. */
  total: number;
}

const IDLE: TimerState = { phase: 'idle', endAt: 0, pausedMs: 0, total: 0 };

/**
 * Rest countdown built on an end timestamp rather than counting ticks, so it
 * is still right after the tab was backgrounded and timers were throttled.
 */
export function useRestTimer() {
  const [state, setState] = useState<TimerState>(IDLE);
  const [now, setNow] = useState(() => Date.now());
  // Adjusting ±15s retunes the default too, so the next rest starts there.
  const durationRef = useRef<number>(loadRestSeconds());

  // Several ticks can land before the state flips (interval plus a
  // visibilitychange), and the buzz must only happen once per rest.
  const buzzedFor = useRef(0);

  const finish = useCallback((forEnd: number) => {
    if (buzzedFor.current === forEnd) return;
    buzzedFor.current = forEnd;
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(200);
      }
    } catch {
      /* some browsers refuse without a recent gesture; the visual cue remains */
    }
    setState((s) => (s.phase === 'running' ? { ...s, phase: 'go' } : s));
  }, []);

  const running = state.phase === 'running';
  const endAt = state.endAt;

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= endAt) finish(endAt);
    };
    const id = setInterval(tick, 250);
    // Throttled timers may not fire while hidden; catch up the moment we're back.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, endAt, finish]);

  useEffect(() => {
    if (state.phase !== 'go') return;
    const id = setTimeout(() => setState(IDLE), GO_LINGER_MS);
    return () => clearTimeout(id);
  }, [state.phase]);

  const start = useCallback((seconds?: number) => {
    const sec = clampRest(seconds ?? durationRef.current);
    const t = Date.now();
    setNow(t);
    setState({ phase: 'running', endAt: t + sec * 1000, pausedMs: 0, total: sec });
  }, []);

  const skip = useCallback(() => setState(IDLE), []);

  const adjust = useCallback((deltaSec: number) => {
    const next = clampRest(durationRef.current + deltaSec);
    durationRef.current = next;
    saveRestSeconds(next);
    setState((s) => {
      if (s.phase !== 'running' && s.phase !== 'paused') return s;
      const t = Date.now();
      const left = (s.phase === 'running' ? s.endAt - t : s.pausedMs) + deltaSec * 1000;
      // Trimming past the end is just "done now".
      if (left <= 0) return { ...s, phase: 'go' };
      const total = Math.max(s.total + deltaSec, Math.ceil(left / 1000));
      return s.phase === 'running'
        ? { ...s, endAt: t + left, total }
        : { ...s, pausedMs: left, total };
    });
    setNow(Date.now());
  }, []);

  const togglePause = useCallback(() => {
    setState((s) => {
      const t = Date.now();
      if (s.phase === 'running') {
        return { ...s, phase: 'paused', pausedMs: Math.max(0, s.endAt - t) };
      }
      if (s.phase === 'paused') {
        return { ...s, phase: 'running', endAt: t + s.pausedMs };
      }
      return s;
    });
    setNow(Date.now());
  }, []);

  const remaining =
    state.phase === 'running'
      ? remainingSeconds(state.endAt, now)
      : state.phase === 'paused'
        ? Math.ceil(state.pausedMs / 1000)
        : 0;

  return { phase: state.phase, remaining, total: state.total, start, skip, adjust, togglePause };
}
