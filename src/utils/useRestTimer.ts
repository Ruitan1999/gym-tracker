import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const DEFAULT_REST_SECONDS = 60;
export const REST_STEP_SECONDS = 15;
export const MIN_REST_SECONDS = 15;
export const MAX_REST_SECONDS = 600;
/** How long "Go" stays up before the bar tucks itself away. */
export const GO_LINGER_MS = 1600;
export const REST_STORAGE_KEY = 'gym-tracker-rest-seconds';
/** The rest under way, so leaving the screen or the app does not lose it. */
export const REST_RUNNING_KEY = 'gym-tracker-rest-running';

export type RestPhase = 'idle' | 'running' | 'paused' | 'go';

export function clampRest(sec: number): number {
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

export function saveRestSeconds(sec: number) {
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
  /** Ended while the screen or app was away: stays up until tapped, so it is seen. */
  late?: boolean;
}

const IDLE: TimerState = { phase: 'idle', endAt: 0, pausedMs: 0, total: 0 };

/** A rest still under way from before the screen was left; a finished one is gone. */
function loadRunning(): TimerState {
  try {
    const raw = localStorage.getItem(REST_RUNNING_KEY);
    if (!raw) return IDLE;
    const s = JSON.parse(raw) as TimerState;
    if (s.phase === 'paused' && s.pausedMs > 0) return s;
    if (s.phase === 'running') {
      return s.endAt > Date.now() ? s : { ...s, phase: 'go', late: true };
    }
  } catch {
    /* unreadable or blocked: start with no rest */
  }
  return IDLE;
}

function saveRunning(s: TimerState) {
  try {
    if (s.phase === 'running' || s.phase === 'paused') {
      localStorage.setItem(REST_RUNNING_KEY, JSON.stringify(s));
    } else {
      localStorage.removeItem(REST_RUNNING_KEY);
    }
  } catch {
    /* remembering is a convenience, never a failure */
  }
}

/**
 * The rest state machine, without a ticking clock.
 *
 * Built on an end timestamp rather than counting ticks, so it is still right
 * after the tab was backgrounded and timers were throttled. Nothing here
 * changes once a second: the form that owns it re-renders only when a rest
 * starts, is adjusted, paused, finishes or is skipped. The countdown the eye
 * sees ticks inside the bar alone (`useRemaining`).
 */
export function useRestTimerCore() {
  const [state, setState] = useState<TimerState>(loadRunning);
  // Adjusting ±15s retunes the default too, so the next rest starts there.
  const durationRef = useRef<number>(loadRestSeconds());

  // The timeout and a visibilitychange catch-up can both land before the state
  // flips, and the buzz must only happen once per rest.
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
    const late = Date.now() - forEnd > 2000;
    setState((s) => (s.phase === 'running' ? { ...s, phase: 'go', late } : s));
  }, []);

  const running = state.phase === 'running';
  const endAt = state.endAt;

  useEffect(() => saveRunning(state), [state]);

  useEffect(() => {
    if (!running) return;
    let id: ReturnType<typeof setTimeout>;
    const check = () => {
      clearTimeout(id);
      const left = endAt - Date.now();
      // A timeout can fire a hair early; look again rather than get stuck at 0:00.
      if (left <= 0) finish(endAt);
      else id = setTimeout(check, left);
    };
    check();
    // Throttled timers may not fire while hidden; catch up the moment we're back.
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [running, endAt, finish]);

  useEffect(() => {
    if (state.phase !== 'go' || state.late) return;
    const id = setTimeout(() => setState(IDLE), GO_LINGER_MS);
    return () => clearTimeout(id);
  }, [state.phase, state.late]);

  const start = useCallback((seconds?: number) => {
    const sec = clampRest(seconds ?? durationRef.current);
    setState({ phase: 'running', endAt: Date.now() + sec * 1000, pausedMs: 0, total: sec });
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
  }, []);

  return {
    phase: state.phase,
    endAt: state.endAt,
    pausedMs: state.pausedMs,
    total: state.total,
    start,
    skip,
    adjust,
    togglePause,
  };
}

export type RestTimerCore = ReturnType<typeof useRestTimerCore>;

/**
 * Whole seconds left for the countdown on screen. This is the only thing that
 * ticks, so call it from the bar and nowhere that re-renders a whole form.
 */
export function useRemaining(
  timer: Pick<RestTimerCore, 'phase' | 'endAt' | 'pausedMs' | 'total'>,
): number {
  const [now, setNow] = useState(() => Date.now());
  const running = timer.phase === 'running';
  const { endAt } = timer;

  // Before paint, so the first frame of a new or resumed rest never shows the
  // number worked out from the last time `now` was taken.
  useLayoutEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 250);
    // Timers are throttled while hidden; show the right number the moment we're back.
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running, endAt]);

  if (timer.phase === 'running') return Math.min(remainingSeconds(endAt, now), timer.total);
  if (timer.phase === 'paused') return Math.ceil(timer.pausedMs / 1000);
  return 0;
}

/** The state machine and its countdown in one, for callers that want both. */
export function useRestTimer() {
  const core = useRestTimerCore();
  return { ...core, remaining: useRemaining(core) };
}
