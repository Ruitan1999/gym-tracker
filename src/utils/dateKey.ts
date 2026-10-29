/**
 * A local calendar date as YYYY-MM-DD. Local, not UTC: an evening session must
 * stay on the day it was trained, and adding days through `new Date(y, m, d + n)`
 * keeps a daylight-saving change from skipping or repeating one.
 */
export function localDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
