import { forwardRef, useEffect, useRef } from 'react';
import type { BodyPart, WorkoutEntry } from '../../types';
import { useAppContext } from '../../context/AppContext';
import {
  currentExerciseId,
  formatSessionVolume,
  sessionProgress,
} from '../../utils/sessionProgress';
import SessionClock from './SessionClock';
import MiniBodyMap from './MiniBodyMap';

interface SessionStripProps {
  entries: WorkoutEntry[];
  startedAt: string | null;
  /** The chip last tapped; stays the current one until that exercise is done. */
  tappedId: string | null;
  bodyParts: BodyPart[];
  onSelect: (entryId: string) => void;
}

/**
 * Where the session stands, pinned under the page header: time and sets, a
 * progress bar with the volume moved so far, and one numbered chip per
 * exercise to jump to it.
 *
 * Sticky inside the page scroller rather than fixed, so it takes up its own
 * room in the flow and cannot cover a card or the title.
 */
const SessionStrip = forwardRef<HTMLDivElement, SessionStripProps>(function SessionStrip(
  { entries, startedAt, tappedId, bodyParts, onSelect },
  ref,
) {
  const { appData } = useAppContext();
  const unit = appData.preferences.weightUnit;
  const progress = sessionProgress(entries);
  const currentId = currentExerciseId(progress.exercises, tappedId);
  const rowRef = useRef<HTMLDivElement>(null);

  // Past eight or so the row runs off the side; keep the ringed chip in view.
  // Scrolls the row itself, never the page, so it cannot fight the card scroll.
  useEffect(() => {
    const row = rowRef.current;
    const chip = currentId
      ? row?.querySelector<HTMLElement>(`[data-chip-id="${currentId}"]`)
      : null;
    if (!row || !chip) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2;
    // Not every environment lays out or scrolls elements (jsdom does neither).
    if (typeof row.scrollTo === 'function') row.scrollTo({ left: Math.max(0, left) });
  }, [currentId, entries.length]);

  const pct = progress.totalSets > 0 ? (progress.setsDone / progress.totalSets) * 100 : 0;

  return (
    <div
      ref={ref}
      data-testid="session-strip"
      className="sticky top-0 z-20 -mx-4 px-4 pt-2"
      style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-line)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {startedAt && <SessionClock startedAt={startedAt} />}
          <span
            className="font-mono"
            style={{
              fontSize: '13px',
              fontVariantNumeric: 'tabular-nums',
              color: 'var(--color-text-muted)',
            }}
          >
            {startedAt ? '· ' : ''}
            {progress.setsDone}/{progress.totalSets} sets
          </span>
        </div>
        <MiniBodyMap parts={bodyParts} />
      </div>

      <div className="flex items-center gap-3 mt-1.5">
        <div
          role="progressbar"
          aria-label="Sets done"
          aria-valuemin={0}
          aria-valuemax={progress.totalSets}
          aria-valuenow={progress.setsDone}
          className="flex-1"
          style={{ height: '3px', background: 'var(--color-line-2)', borderRadius: 2 }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: 'var(--color-volt)',
              borderRadius: 2,
              transition: 'width 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          />
        </div>
        <span
          className="font-mono shrink-0"
          style={{
            fontSize: '12px',
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--color-text-muted)',
          }}
        >
          {formatSessionVolume(progress.volumeKg, unit)}
        </span>
      </div>

      {/* The scroller is a plain row so a swipe on it scrolls it sideways; the
          tall buttons keep the touch target at 44px while the drawn chip is
          smaller. */}
      <div
        ref={rowRef}
        role="group"
        aria-label="Exercises"
        className="flex overflow-x-auto -mx-4 px-4"
        style={{ gap: 8, scrollbarWidth: 'none', overscrollBehaviorX: 'contain' }}
      >
        {entries.map((entry, i) => {
          const p = progress.exercises[i];
          const isCurrent = entry.id === currentId;
          const name =
            appData.exercises.find((e) => e.id === entry.exerciseId)?.name ?? 'Exercise';
          const state = p.done ? 'done' : 'not done';
          return (
            <button
              key={entry.id}
              type="button"
              data-chip-id={entry.id}
              data-current={isCurrent ? 'true' : undefined}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Exercise ${i + 1} of ${entries.length}, ${name}, ${p.setsDone} of ${p.totalSets} sets, ${state}`}
              onClick={() => onSelect(entry.id)}
              className="press shrink-0 flex items-center justify-center"
              style={{ width: 44, height: 44 }}
            >
              <span
                aria-hidden
                className="flex items-center justify-center font-mono"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  // The fill climbs with the exercise's own sets.
                  background: p.done
                    ? 'var(--color-done)'
                    : `linear-gradient(to top, var(--color-volt-line) ${p.fraction * 100}%, var(--color-surface) ${p.fraction * 100}%)`,
                  color: p.done ? '#ffffff' : isCurrent ? 'var(--color-volt)' : 'var(--color-text-muted)',
                  border: `1.5px solid ${
                    isCurrent ? 'var(--color-volt)' : p.done ? 'var(--color-done)' : 'var(--color-line-2)'
                  }`,
                  boxShadow: isCurrent ? '0 0 0 2px var(--color-volt-tint)' : undefined,
                }}
              >
                {p.done ? (
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="square">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default SessionStrip;
