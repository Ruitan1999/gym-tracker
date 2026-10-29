import type { Workout, WorkoutEntry, WorkoutGroup, WorkoutSet } from '../types';

/**
 * The session a template turns into, and where it waits until the form picks
 * it up.
 *
 * This lives apart from the form because the home screen can now start a
 * session too — from the Next Up card — and both have to hand the form exactly
 * the same thing.
 */
export const DRAFT_KEY = 'liftgauge.workoutDraft.v1';

export interface Draft {
  date: string;
  name?: string;
  entries: WorkoutEntry[];
  notes: string;
  collapsedIds: string[];
  /** The template this session was started from, if any. */
  sourceGroupId?: string;
  /** When the clock started, so it survives a reload mid-session. */
  startedAt?: string;
  /**
   * Sets that were filled in from last time and not touched since, as indices
   * per entry id. They hold numbers but nothing has been recorded against them.
   * Absent means every set is the owner's own.
   */
  unconfirmed?: Unconfirmed;
}

/** Entry id -> indices of the sets still showing numbers nobody has confirmed. */
export type Unconfirmed = Record<string, number[]>;

export function isUnconfirmed(unconfirmed: Unconfirmed | undefined, entryId: string, index: number): boolean {
  return !!unconfirmed?.[entryId]?.includes(index);
}

/** Every set that arrived with numbers in it; the empty ones have nothing to confirm. */
export function unconfirmedOf(entries: WorkoutEntry[]): Unconfirmed {
  const out: Unconfirmed = {};
  for (const e of entries) {
    const idx = e.sets.flatMap((s, i) => (s.reps > 0 || s.weightKg > 0 ? [i] : []));
    if (idx.length > 0) out[e.id] = idx;
  }
  return out;
}

function withEntry(unconfirmed: Unconfirmed, entryId: string, indices: number[]): Unconfirmed {
  const rest = Object.fromEntries(Object.entries(unconfirmed).filter(([id]) => id !== entryId));
  return indices.length > 0 ? { ...rest, [entryId]: indices } : rest;
}

/** The owner touched this set, so its numbers are theirs now. */
export function confirmSet(unconfirmed: Unconfirmed, entryId: string, index: number): Unconfirmed {
  const list = unconfirmed[entryId];
  if (!list?.includes(index)) return unconfirmed;
  const left = list.filter((i) => i !== index);
  return withEntry(unconfirmed, entryId, left);
}

/** Everything on this exercise counts, e.g. once it is marked done. */
export function confirmEntry(unconfirmed: Unconfirmed, entryId: string): Unconfirmed {
  if (!(entryId in unconfirmed)) return unconfirmed;
  return withEntry(unconfirmed, entryId, []);
}

/** Row `removed` is gone; the rows below it moved up one. */
export function shiftAfterRemoval(unconfirmed: Unconfirmed, entryId: string, removed: number): Unconfirmed {
  const list = unconfirmed[entryId];
  if (!list) return unconfirmed;
  const next = list.filter((i) => i !== removed).map((i) => (i > removed ? i - 1 : i));
  return withEntry(unconfirmed, entryId, next);
}

/** A set counts as recorded work unless it is still just last time's numbers. */
export function isRecorded(s: WorkoutSet, unconfirmed: Unconfirmed | undefined, entryId: string, index: number): boolean {
  return (s.reps > 0 || s.weightKg > 0) && !isUnconfirmed(unconfirmed, entryId, index);
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

/**
 * A draft only counts as a session worth protecting once something's actually
 * been recorded — otherwise starting a different template has nothing to lose.
 */
export function draftHasProgress(draft: Draft | null): boolean {
  if (!draft) return false;
  const hasLoggedWork = draft.entries.some((e) =>
    e.sets.some((s, i) => isRecorded(s, draft.unconfirmed, e.id, i)),
  );
  return hasLoggedWork || draft.notes.trim().length > 0;
}

export function todayString(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * What this exercise was last done for, so a session opens on the weights the
 * owner actually lifted rather than on zeroes.
 */
export function lastSetsFor(workouts: Workout[], exerciseId: string): WorkoutSet[] | null {
  const sorted = [...workouts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  for (const w of sorted) {
    const entry = w.entries.find((e) => e.exerciseId === exerciseId);
    if (entry && entry.sets.length > 0) {
      return entry.sets.map((s, i) => ({ setNumber: i + 1, reps: s.reps, weightKg: s.weightKg }));
    }
  }
  return null;
}

export interface StartOptions {
  /** Fill each set from last time instead of leaving it blank. */
  autoFill?: boolean;
}

/**
 * The sets a fresh exercise opens on.
 *
 * The count always carries over. The numbers only do when auto-fill is on:
 * otherwise how many sets is the plan and what went on the bar is today's
 * business.
 */
export function startingSets(lastSets: WorkoutSet[] | null, autoFill = false): WorkoutSet[] {
  if (!lastSets) return [{ setNumber: 1, reps: 0, weightKg: 0 }];
  return lastSets.map((s, j) =>
    autoFill
      ? { setNumber: j + 1, reps: s.reps, weightKg: s.weightKg }
      : { setNumber: j + 1, reps: 0, weightKg: 0 },
  );
}

export function entriesFromTemplate(
  group: WorkoutGroup,
  workouts: Workout[],
  { autoFill = false }: StartOptions = {},
): WorkoutEntry[] {
  return group.exerciseIds.map((exerciseId) => ({
    id: crypto.randomUUID(),
    exerciseId,
    sets: startingSets(lastSetsFor(workouts, exerciseId), autoFill),
  }));
}

/**
 * A session ready to be opened, with every exercise folded.
 *
 * All folded including the first: a template is a set of exercises rather than
 * an order to do them in, so opening one is a guess at where the owner starts.
 */
export function draftFromTemplate(
  group: WorkoutGroup,
  workouts: Workout[],
  { startedAt = new Date().toISOString(), autoFill = false }: StartOptions & { startedAt?: string } = {},
): Draft {
  const entries = entriesFromTemplate(group, workouts, { autoFill });
  const unconfirmed = unconfirmedOf(entries);
  return {
    date: todayString(),
    name: group.name,
    entries,
    notes: '',
    collapsedIds: entries.map((e) => e.id),
    sourceGroupId: group.id,
    startedAt,
    ...(Object.keys(unconfirmed).length > 0 ? { unconfirmed } : {}),
  };
}
