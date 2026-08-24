import { useMemo } from 'react';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ExerciseStrip from '../shared/ExerciseStrip';
import { draftFromTemplate, saveDraft, todayString } from '../../utils/templateSession';
import {
  DAY_CODES,
  DAY_NAMES,
  nextUpcoming,
  hasAnySchedule,
  templatesOn,
  todayIndex,
} from '../../utils/schedule';
import type { Workout, WorkoutGroup } from '../../types';

// Matches the momentum card's icons, which render at the same size.
const ICON_STROKE = 2;

/** How the day reads on the card: today by name, anything else by its own. */
function dayLabel(day: number, daysAway: number): string {
  if (daysAway === 0) return `TODAY · ${DAY_CODES[day]}`;
  if (daysAway === 1) return `TOMORROW · ${DAY_CODES[day]}`;
  return DAY_NAMES[day].toUpperCase();
}

function sessionSummary(workout: Workout): string {
  const exercises = workout.entries.length;
  const sets = workout.entries.reduce((acc, e) => acc + e.sets.length, 0);
  return `${exercises} exercise${exercises === 1 ? '' : 's'} · ${sets} set${sets === 1 ? '' : 's'}`;
}

/**
 * What to train next, and one press to start it.
 *
 * The home screen used to open on a list of templates that all read the same
 * and left the choosing to the owner every single time. With days on a
 * template there is usually one right answer, so the card says which and gets
 * out of the way — and where there isn't one, it says that instead of guessing.
 */
export default function NextUpCard() {
  const { appData } = useAppContext();
  const navigate = useNavigate();

  const groups = useMemo(() => appData.groups ?? [], [appData.groups]);
  const today = todayIndex();

  const dueToday = useMemo(() => templatesOn(groups, today), [groups, today]);
  const upcoming = useMemo(() => nextUpcoming(groups, today), [groups, today]);

  const loggedToday = useMemo(() => {
    const iso = todayString();
    return appData.workouts
      .filter((w) => w.date === iso)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [appData.workouts]);

  function start(group: WorkoutGroup) {
    saveDraft(draftFromTemplate(group, appData.workouts));
    navigate('/workout/new');
  }

  // Nothing to say until there is at least one template to schedule.
  if (groups.length === 0) return null;

  // Trained today already: the card steps back rather than nagging for a second
  // session, and points at what is next instead.
  if (loggedToday) {
    return (
      <Shell tone="done">
        <Eyebrow left="DONE TODAY" leftColor="var(--color-done-deep)" right={
          upcoming ? `NEXT · ${DAY_CODES[upcoming.day]}` : undefined
        } />
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="shrink-0 flex items-center justify-center"
            style={{
              width: 30,
              height: 30,
              background: 'var(--color-done)',
              borderRadius: 'var(--radius)',
              color: '#ffffff',
            }}
          >
            <Dumbbell className="w-4 h-4" strokeWidth={ICON_STROKE} />
          </span>
          <Name>{loggedToday.name || 'Session logged'}</Name>
        </div>
        <div
          className="font-mono text-[12px] mb-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {sessionSummary(loggedToday)}
        </div>
        <button
          type="button"
          onClick={() => navigate(`/history/${loggedToday.id}`)}
          className="w-full h-12 press caps-tight text-[11px]"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-done-line)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            fontWeight: 700,
            letterSpacing: '0.12em',
          }}
        >
          VIEW SESSION →
        </button>
      </Shell>
    );
  }

  // Something is due today: this is the whole point of the card.
  if (dueToday.length > 0) {
    const [first, ...alsoToday] = dueToday;
    return (
      <Shell tone="due">
        <Eyebrow
          left="NEXT UP"
          leftColor="var(--color-volt)"
          right={dayLabel(today, 0)}
        />
        <TemplateLine group={first} />
        <div className="mb-4">
          <ExerciseStrip exerciseIds={first.exerciseIds} max={8} />
        </div>
        <button
          type="button"
          onClick={() => start(first)}
          className="w-full h-14 btn-volt press caps-tight text-[11px]"
          style={{
            borderRadius: 'var(--radius)',
            letterSpacing: '0.12em',
            boxShadow:
              '0 12px 32px -8px var(--color-volt-glow), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
          }}
        >
          START WORKOUT →
        </button>

        {/* Two templates can share a day. The second is offered underneath
            rather than beside, so there is still one obvious button. */}
        {alsoToday.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => start(g)}
            className="w-full h-11 mt-2.5 px-3 flex items-center justify-between gap-2 press"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius)',
            }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="truncate" style={{ fontSize: '13px', fontWeight: 600 }}>
                {g.name}
              </span>
              <span
                className="font-mono text-[11px] shrink-0"
                style={{ color: 'var(--color-text-faint)' }}
              >
                ({g.exerciseIds.length})
              </span>
            </span>
            <span
              className="caps-tight text-[9px] shrink-0"
              style={{ color: 'var(--color-volt)' }}
            >
              ALSO TODAY →
            </span>
          </button>
        ))}
      </Shell>
    );
  }

  // Days are set, just not today's. A rest day is a real answer, so the card
  // gives it — with a way through for anyone who wants to train anyway.
  if (upcoming) {
    return (
      <Shell tone="rest">
        <Eyebrow
          left="NEXT UP"
          leftColor="var(--color-text-faint)"
          right={dayLabel(upcoming.day, upcoming.daysAway)}
        />
        <TemplateLine group={upcoming.group} />
        <div className="mb-4">
          <ExerciseStrip exerciseIds={upcoming.group.exerciseIds} max={8} />
        </div>
        <button
          type="button"
          onClick={() => start(upcoming.group)}
          className="w-full h-12 btn-ghost press caps-tight text-[11px]"
          style={{ borderRadius: 'var(--radius)', letterSpacing: '0.12em' }}
        >
          START EARLY →
        </button>
      </Shell>
    );
  }

  // Templates, but none of them on the calendar.
  if (!hasAnySchedule(groups)) {
    return (
      <Shell tone="empty">
        <Eyebrow left="NEXT UP" leftColor="var(--color-text-faint)" />
        <Name>Give your week a shape</Name>
        <p
          className="mt-1.5 mb-4"
          style={{ fontSize: '13px', color: 'var(--color-text-muted)', lineHeight: 1.45 }}
        >
          Pick the days you train a template and it waits for you here.
        </p>
        <button
          type="button"
          onClick={() => navigate('/groups')}
          className="w-full h-12 btn-ghost press caps-tight text-[11px]"
          style={{ borderRadius: 'var(--radius)', letterSpacing: '0.12em' }}
        >
          SET WORKOUT DAYS →
        </button>
      </Shell>
    );
  }

  return null;
}

function Shell({ tone, children }: { tone: 'due' | 'rest' | 'done' | 'empty'; children: React.ReactNode }) {
  const style =
    tone === 'due'
      ? { background: 'var(--color-volt-wash)', border: '1px solid rgba(4, 120, 87, 0.18)' }
      : tone === 'done'
      ? { background: 'var(--color-done-tint)', border: '1px solid var(--color-done-line)' }
      : tone === 'empty'
      ? { background: 'var(--color-elev)', border: '1px dashed var(--color-line-2)' }
      : { background: 'var(--color-surface)', border: '1px solid var(--color-line)' };

  return (
    <section className="p-4 mb-4" style={{ ...style, borderRadius: 'var(--radius)' }}>
      {children}
    </section>
  );
}

function Eyebrow({
  left,
  leftColor,
  right,
}: {
  left: string;
  leftColor: string;
  right?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="caps-tight text-[9px]" style={{ color: leftColor }}>
        {left}
      </span>
      {right && (
        <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
          {right}
        </span>
      )}
    </div>
  );
}

function Name({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="font-display"
      style={{
        fontSize: '1.375rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        fontVariationSettings: '"wdth" 90',
        lineHeight: 1.1,
        color: 'var(--color-text)',
      }}
    >
      {children}
    </span>
  );
}

/** The template's name with its count, as the cards below it read. */
function TemplateLine({ group }: { group: WorkoutGroup }) {
  return (
    <div className="flex items-baseline gap-1.5 mb-3 min-w-0">
      <span className="truncate">
        <Name>{group.name}</Name>
      </span>
      <span
        className="font-mono text-[13px] shrink-0"
        style={{ color: 'var(--color-text-faint)' }}
      >
        ({group.exerciseIds.length})
      </span>
    </div>
  );
}
