import type { AppData } from '../types';

/**
 * Whether to show the new-user guide: when asked for again from Settings, or
 * on an account with nothing in it yet that has not been through it.
 */
export function shouldShowGuide(appData: Pick<AppData, 'preferences' | 'workouts' | 'groups'>): boolean {
  const seen = appData.preferences.guideSeen;
  if (seen === false) return true;
  if (seen === true) return false;
  return appData.workouts.length === 0 && (appData.groups ?? []).length === 0;
}
