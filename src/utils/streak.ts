/**
 * Streaks are counted in weeks, not days. Nobody trains seven days a week, so
 * a day-based streak only ever measured how recently it had broken.
 */

function startOfLocalDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseIsoDate(iso: string): Date | null {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** The Monday that opens the week containing `date`, as a YYYY-MM-DD key. */
export function weekStartIso(date: Date): string {
  const d = startOfLocalDay(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return isoDate(d);
}

/**
 * Consecutive weeks with at least one session, counting back from this week.
 *
 * A week you haven't trained yet doesn't break the run — the week isn't over,
 * and a streak that resets every Monday morning is just a nag.
 */
export function weeklyStreak(workoutDates: Iterable<string>, today: Date = new Date()): number {
  const weeks = new Set<string>();
  for (const iso of workoutDates) {
    const d = parseIsoDate(iso);
    if (d) weeks.add(weekStartIso(d));
  }
  if (weeks.size === 0) return 0;

  const cursor = parseIsoDate(weekStartIso(today));
  if (!cursor) return 0;
  if (!weeks.has(isoDate(cursor))) cursor.setDate(cursor.getDate() - 7);

  let streak = 0;
  while (weeks.has(isoDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}
