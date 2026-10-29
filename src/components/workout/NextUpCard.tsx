import { useMemo, useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ExerciseStrip from '../shared/ExerciseStrip';
import MiniBodyMap from './MiniBodyMap';
import { bodyPartsOfTemplate } from '../../utils/bodyParts';
import ConfirmModal from '../shared/ConfirmModal';
import { todayString } from '../../utils/templateSession';
import { DAY_CODES, DAY_NAMES, todayIndex } from '../../utils/schedule';
import { selectNextUp } from '../../utils/nextUp';
import { trainingModeOf } from '../../utils/rotation';
import { beginTemplate, replaceDraftWith } from '../../utils/startSession';
import { scrollToTemplateList } from '../../utils/templateList';
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
  const [pendingStart, setPendingStart] = useState<WorkoutGroup | null>(null);

  const groups = useMemo(() => appData.groups ?? [], [appData.groups]);
  const today = todayIndex();

  const mode = trainingModeOf(appData.preferences);
  // The same choice the bottom nav's Start button makes, from one function.
  const pick = useMemo(
    () => selectNextUp(groups, appData.workouts, mode, today, todayString()),
    [groups, appData.workouts, mode, today],
  );

  const startOptions = { autoFill: !!appData.preferences.autoFillFromLast };

  function start(group: WorkoutGroup) {
    if (beginTemplate(group, appData.workouts, startOptions) === 'confirm') {
      // A different template already has real work logged against it — jumping
      // straight into this one would silently wipe that out.
      setPendingStart(group);
      return;
    }
    navigate('/workout/new');
  }

  function confirmStart(group: WorkoutGroup) {
    replaceDraftWith(group, appData.workouts, startOptions);
    setPendingStart(null);
    navigate('/workout/new');
  }

  const confirmModal = pendingStart && (
    <ConfirmModal
      eyebrow="WORKOUT IN PROGRESS"
      title={`Start "${pendingStart.name}" instead?`}
      message="Your current workout hasn't been saved yet — starting a new one will discard it."
      confirmLabel="DISCARD & START →"
      cancelLabel="KEEP CURRENT"
      destructive
      onConfirm={() => confirmStart(pendingStart)}
      onClose={() => setPendingStart(null)}
    />
  );

  // Nothing to say until there is at least one template to schedule.
  if (pick.kind === 'none') return null;

  // Trained today already: the card steps back rather than nagging for a second
  // session, and points at what is next instead. Still today's business, so it
  // keeps the banner — deep green rather than the due colour, so the two never
  // get mistaken for each other at a glance.
  if (pick.kind === 'done') {
    const loggedToday = pick.workout;
    const upcoming = pick.upcoming;
    return (
      <Shell tone="done">
        <Ribbon
          background="var(--color-done-deep)"
          left="DONE TODAY"
          right={
            upcoming
              ? `NEXT · ${DAY_CODES[upcoming.day]}`
              : pick.rotationNext
              ? `NEXT · ${pick.rotationNext.name}`
              : undefined
          }
        />
        <div style={{ padding: '14px 16px 16px 16px' }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 30,
                height: 30,
                background: 'var(--color-done)',
                borderRadius: '7px',
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
        </div>
      </Shell>
    );
  }

  // Rotation: no weekday to name, just whichever template is next in turn.
  // Same card, same one press to start as a scheduled day.
  if (pick.kind === 'rotation') {
    return (
      <>
        <Shell tone="due">
          <button
            type="button"
            onClick={() => start(pick.group)}
            className="w-full text-left press block"
          >
            <Ribbon background="var(--color-volt)" left="NEXT UP" right="NEXT IN ROTATION" />
            <div style={{ padding: '14px 16px 16px 16px' }}>
              <TemplateLine group={pick.group} />
              <PictureRow group={pick.group} />
            </div>
          </button>
          {groups.length > 1 && <ChooseDifferent />}
        </Shell>
        {confirmModal}
      </>
    );
  }

  // Something is due today: this is the whole point of the card, and the
  // banner is what makes that unmissable — the eyebrow it replaced was too
  // easy to skip past now that the card itself is the only button.
  if (pick.kind === 'due') {
    const { first, alsoToday } = pick;
    return (
      <>
      <Shell tone="due">
        <button
          type="button"
          onClick={() => start(first)}
          className="w-full text-left press block"
        >
          <Ribbon background="var(--color-volt)" left="NEXT UP" right={dayLabel(today, 0)} />
          <div style={{ padding: '14px 16px 16px 16px' }}>
            <TemplateLine group={first} />
            <PictureRow group={first} />
          </div>
        </button>

        {/* Two templates can share a day. The second is offered underneath
            rather than beside, so there is still one obvious button. */}
        {alsoToday.length > 0 && (
          <div
            className="flex flex-col gap-2"
            style={{ padding: '0 16px 16px 16px' }}
          >
            {alsoToday.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => start(g)}
                className="w-full h-11 px-3 flex items-center justify-between gap-2 press"
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
          </div>
        )}
        {groups.length > 1 && <ChooseDifferent />}
      </Shell>
      {confirmModal}
      </>
    );
  }

  // Days are set, just not today's. A rest day is a real answer, so the card
  // gives it — quietly: a coloured banner here would claim an urgency the day
  // doesn't have, so it stays plain text.
  if (pick.kind === 'upcoming') {
    const { upcoming } = pick;
    return (
      <>
      <Shell tone="rest">
        <div className="p-4">
          <Eyebrow
            left="NEXT UP"
            leftColor="var(--color-text-faint)"
            right={dayLabel(upcoming.day, upcoming.daysAway)}
          />
          <TemplateLine group={upcoming.group} />
          <div className="mb-4">
            <PictureRow group={upcoming.group} />
          </div>
          <button
            type="button"
            onClick={() => start(upcoming.group)}
            className="w-full h-12 btn-ghost press caps-tight text-[11px]"
            style={{ borderRadius: 'var(--radius)', letterSpacing: '0.12em' }}
          >
            START EARLY →
          </button>
          {groups.length > 1 && <ChooseDifferent />}
        </div>
      </Shell>
      {confirmModal}
      </>
    );
  }

  // Templates, but none of them on the calendar.
  if (pick.kind === 'unscheduled') {
    return (
      <Shell tone="empty">
        <div className="p-4">
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
        </div>
      </Shell>
    );
  }

  return null;
}

/**
 * A way out of the suggestion that never changes anything: it only scrolls to
 * the template list further down. Callers show it only when there is another
 * template to choose.
 */
function ChooseDifferent() {
  return (
    <button
      type="button"
      onClick={scrollToTemplateList}
      className="w-full h-11 press caps-tight text-[10px] flex items-center justify-center"
      style={{ color: 'var(--color-text-muted)' }}
    >
      Choose a different workout
    </button>
  );
}

function Shell({ tone, children }: { tone: 'due' | 'rest' | 'done' | 'empty'; children: React.ReactNode }) {
  const style =
    tone === 'due'
      ? { background: 'var(--color-volt-wash)', border: '1px solid var(--color-volt-line)' }
      : tone === 'done'
      ? { background: 'var(--color-done-tint)', border: '1px solid var(--color-done-line)' }
      : tone === 'empty'
      ? { background: 'var(--color-elev)', border: '1px dashed var(--color-line-2)' }
      : { background: 'var(--color-surface)', border: '1px solid var(--color-line)' };

  return (
    <section
      className="mb-4 overflow-hidden"
      style={{ ...style, borderRadius: 'var(--radius)' }}
    >
      {children}
    </section>
  );
}

/**
 * A full-width band across the top of the card, for the two states that are
 * about today. Left as plain text on the other states — a colour this bold
 * would claim urgency days that aren't today don't have.
 */
function Ribbon({
  background,
  left,
  right,
}: {
  background: string;
  left: string;
  right?: string;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{ background, padding: '10px 16px' }}
    >
      <span
        className="font-mono"
        style={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '11px',
          color: '#ffffff',
        }}
      >
        {left}
      </span>
      {right && (
        <span
          className="font-mono"
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.75)',
          }}
        >
          {right}
        </span>
      )}
    </div>
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

/**
 * The exercise pictures with the body map at the right end. The map is the
 * quick read ("legs today"); the pictures say which exercises.
 */
function PictureRow({ group }: { group: WorkoutGroup }) {
  const { appData } = useAppContext();
  return (
    <div className="flex items-center justify-between gap-3">
      <ExerciseStrip exerciseIds={group.exerciseIds} max={8} />
      <span className="ml-auto">
        <MiniBodyMap parts={bodyPartsOfTemplate(group.exerciseIds, appData.exercises)} />
      </span>
    </div>
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
