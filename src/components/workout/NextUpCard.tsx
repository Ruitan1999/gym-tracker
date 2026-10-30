import { useMemo, useState } from 'react';
import { ArrowLeftRight, CalendarDays, Check, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import ConfirmModal from '../shared/ConfirmModal';
import { todayString } from '../../utils/templateSession';
import { DAY_CODES, DAY_NAMES, todayIndex } from '../../utils/schedule';
import { selectNextUp } from '../../utils/nextUp';
import { trainingModeOf } from '../../utils/rotation';
import { beginTemplate, replaceDraftWith } from '../../utils/startSession';
import WeekStrip from './WeekStrip';
import type { WeekDay } from '../../utils/thisWeek';
import { useThisWeek } from '../../utils/useThisWeek';
import type { Workout, WorkoutGroup } from '../../types';

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

  const week = useThisWeek().days;

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

  // No template to suggest yet, but the week itself is still worth showing.
  if (pick.kind === 'none') {
    return <Card week={week} />;
  }

  const choose = groups.length > 1 ? <ChooseDifferent onChoose={() => navigate('/groups')} /> : null;

  // Trained today already: the row steps back to what was done, and names
  // what is next rather than asking for a second session.
  if (pick.kind === 'done') {
    const loggedToday = pick.workout;
    const next = pick.upcoming
      ? `NEXT · ${DAY_CODES[pick.upcoming.day]}`
      : pick.rotationNext
        ? `NEXT · ${pick.rotationNext.name}`
        : null;
    return (
      <Card week={week}>
        <Row
          tone="done"
          label="DONE TODAY"
          name={loggedToday.name || 'Session logged'}
          sub={sessionSummary(loggedToday)}
          onPress={() => navigate(`/history/${loggedToday.id}`)}
        />
        {next && (
          <p
            className="caps-tight text-center mt-3 mb-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {next}
          </p>
        )}
      </Card>
    );
  }

  if (pick.kind === 'rotation') {
    return (
      <>
        <Card week={week} footer={choose}>
          <Row
            tone="due"
            label="NEXT IN ROTATION"
            name={pick.group.name}
            action="START"
            onPress={() => start(pick.group)}
          />
        </Card>
        {confirmModal}
      </>
    );
  }

  if (pick.kind === 'due') {
    const { first, alsoToday } = pick;
    return (
      <>
        <Card week={week} footer={choose}>
          <Row
            tone="due"
            label={dayLabel(today, 0)}
            name={first.name}
            action="START"
            onPress={() => start(first)}
          />
          {/* Two templates can share a day; the second is a row of its own. */}
          {alsoToday.map((g) => (
            <div key={g.id} className="mt-2">
              <Row
                tone="quiet"
                label="ALSO TODAY"
                name={g.name}
                action="START"
                onPress={() => start(g)}
              />
            </div>
          ))}
        </Card>
        {confirmModal}
      </>
    );
  }

  // A rest day is a real answer: the next one shows quietly, and can still be
  // started early.
  if (pick.kind === 'upcoming') {
    const { upcoming } = pick;
    return (
      <>
        <Card week={week} footer={choose}>
          <Row
            tone="quiet"
            label={dayLabel(upcoming.day, upcoming.daysAway)}
            name={upcoming.group.name}
            action="START EARLY"
            onPress={() => start(upcoming.group)}
          />
        </Card>
        {confirmModal}
      </>
    );
  }

  // Templates, but none of them on the calendar.
  if (pick.kind === 'unscheduled') {
    return (
      <Card week={week}>
        <Row
          tone="quiet"
          label="NEXT UP"
          name="Give your week a shape"
          sub="Pick the days you train a template."
          action="SET WORKOUT DAYS"
          icon="calendar"
          onPress={() => navigate('/groups')}
        />
      </Card>
    );
  }

  return null;
}

/**
 * A way out of the suggestion that never changes anything: it only opens Plan,
 * where every template is. Shown only when there is another template to choose.
 */
function ChooseDifferent({ onChoose }: { onChoose: () => void }) {
  return (
    <button
      type="button"
      onClick={onChoose}
      className="w-full h-12 press flex items-center justify-center gap-2"
      style={{ color: 'var(--color-volt)', fontSize: '14px', fontWeight: 600 }}
    >
      <ArrowLeftRight aria-hidden size={16} strokeWidth={ICON_STROKE} />
      Choose a different workout
    </button>
  );
}

/** The week across the top, the suggestion under it, the way out last. */
function Card({
  week,
  footer,
  children,
}: {
  week: WeekDay[];
  footer?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="card mb-4 p-3">
      <WeekStrip days={week} />
      {children && <div className="mt-3">{children}</div>}
      {footer && <div className="mt-1 -mb-1">{footer}</div>}
    </section>
  );
}

const TONES = {
  due: { panel: 'var(--color-volt-wash)', badge: 'var(--color-volt)', pill: 'var(--color-volt)', pillText: '#ffffff' },
  done: { panel: 'var(--color-done-tint)', badge: 'var(--color-done)', pill: 'var(--color-surface)', pillText: 'var(--color-done-deep)' },
  quiet: { panel: 'var(--color-elev)', badge: 'var(--color-text-muted)', pill: 'var(--color-surface)', pillText: 'var(--color-text)' },
} as const;

/**
 * One compact line: what kind of day it is, the template and the one thing
 * to do. The whole row is the button, so the target is the
 * full width rather than the small pill alone.
 */
function Row({
  tone,
  label,
  name,
  sub,
  action,
  icon = tone === 'done' ? 'check' : 'dumbbell',
  onPress,
}: {
  tone: keyof typeof TONES;
  label: string;
  name: string;
  sub?: string;
  /** Left off where the whole row is the only thing to press, as on a finished day. */
  action?: string;
  icon?: 'dumbbell' | 'check' | 'calendar';
  onPress: () => void;
}) {
  const t = TONES[tone];
  const Icon = icon === 'check' ? Check : icon === 'calendar' ? CalendarDays : Dumbbell;
  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full text-left press flex items-center gap-3"
      style={{ background: t.panel, borderRadius: 'var(--radius)', padding: '12px' }}
    >
      <span
        aria-hidden
        className="shrink-0 flex items-center justify-center"
        style={{ width: 40, height: 40, borderRadius: '10px', background: t.badge, color: '#ffffff' }}
      >
        <Icon size={20} strokeWidth={ICON_STROKE} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block caps-tight" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
        {/* Up to two lines: a long template name is the one thing to read here. */}
        <span
          className="block font-display line-clamp-2 break-words"
          style={{
            fontSize: '1.0625rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            fontVariationSettings: '"wdth" 95',
            color: 'var(--color-text)',
          }}
        >
          {name}
        </span>
        {sub && (
          <span className="block font-mono text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            {sub}
          </span>
        )}
      </span>
      {action && (
        <span
          className="shrink-0 caps-tight px-3 h-9 flex items-center"
          style={{
            background: t.pill,
            color: t.pillText,
            borderRadius: '999px',
            fontWeight: 700,
            border: tone === 'due' ? 'none' : '1px solid var(--color-line-2)',
          }}
        >
          {action}
        </span>
      )}
    </button>
  );
}
