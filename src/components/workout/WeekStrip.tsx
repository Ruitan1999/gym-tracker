import { DAY_CODES, DAY_NAMES } from '../../utils/schedule';
import type { WeekDay } from '../../utils/thisWeek';

/**
 * Monday to Sunday with their dates, so the suggestion below reads against
 * the week it sits in. Today is the filled circle; a dot underneath says a
 * session was logged (green) or a template is set for a day still ahead
 * (grey). Looked at, not pressed: the Log Book has the full calendar.
 */
export default function WeekStrip({ days }: { days: WeekDay[] }) {
  return (
    <div>
      <div
        className="caps-tight text-center mb-2"
        style={{ color: 'var(--color-text-muted)' }}
      >
        This week
      </div>
      <ol className="grid grid-cols-7" aria-label="This week">
        {days.map((d) => {
          const missed = !d.trained && !d.isFuture && !d.isToday;
          const states = [
            d.isToday && 'today',
            d.trained && 'trained',
            !d.trained && d.scheduled && 'planned',
            missed && 'not trained',
          ].filter(Boolean);
          return (
            <li
              key={d.iso}
              className="flex flex-col items-center gap-1"
              aria-current={d.isToday ? 'date' : undefined}
            >
              {/* Real text for screen readers; an aria-label on a list item is
                  often not read out. */}
              <span className="sr-only">
                {`${DAY_NAMES[d.index]} ${d.dayOfMonth}${states.length ? `, ${states.join(', ')}` : ''}`}
              </span>
              <span
                aria-hidden
                className="caps-tight"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {DAY_CODES[d.index].slice(0, 2)}
              </span>
              <span
                aria-hidden
                className="font-mono flex items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '999px',
                  fontSize: '15px',
                  fontWeight: d.isToday ? 700 : 500,
                  fontVariantNumeric: 'tabular-nums',
                  background: d.isToday ? 'var(--color-volt)' : 'transparent',
                  color: d.isToday
                    ? '#ffffff'
                    : missed
                      ? 'var(--color-text-faint)'
                      : 'var(--color-text)',
                }}
              >
                {d.dayOfMonth}
              </span>
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '999px',
                  background: d.trained
                    ? 'var(--color-done)'
                    : d.scheduled
                      ? 'var(--color-line-3)'
                      : 'transparent',
                }}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
