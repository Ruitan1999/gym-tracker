import type { AppData } from '../types';
import { exerciseImageUrl } from './exerciseImage';
import { usedExerciseIds } from './warmExerciseImages';
import { savingData, whenIdle } from './prefetchImages';


/**
 * The shipped pictures to keep on the phone, this account's own exercises
 * first. The whole library is small (about 7.7 MB once, 4 KB a picture) and
 * having it stored is what makes the picker and a newly added exercise show
 * their pictures at once. With Data Saver on, only the account's own
 * exercises, which it is going to look at anyway.
 */
export function picturesToStore(
  appData: Pick<AppData, 'groups' | 'workouts' | 'exercises'>,
  saveData: boolean,
  replaced: Record<string, string> = {},
): string[] {
  // With the whole library to follow, recent sessions are enough to set the
  // order; with Data Saver, every exercise ever logged is the whole list.
  const ids = usedExerciseIds(appData, saveData ? Infinity : 25);
  if (!saveData) {
    for (const e of appData.exercises) ids.push(e.id);
  }
  const urls = new Set<string>();
  for (const id of ids) {
    // Only the shipped files: they live on this site and never change under
    // their name. Pictures someone uploaded are elsewhere and cached by the
    // browser as usual.
    // A picture someone has replaced is shown from elsewhere; storing the
    // shipped file for it would keep something never displayed.
    if (replaced[id]) continue;
    const url = exerciseImageUrl(id);
    if (url) urls.add(url);
  }
  return [...urls];
}

/**
 * Asks the service worker to store the pictures, once the app has settled.
 * Does nothing where there is no worker (development, tests, old browsers).
 */
export function storePictures(
  appData: Pick<AppData, 'groups' | 'workouts' | 'exercises'>,
  replaced: Record<string, string>,
): () => void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return () => {};
  let cancelled = false;
  const cancelIdle = whenIdle(() => {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (cancelled) return;
        const saveData = savingData();
        registration.active?.postMessage({
          type: 'store-pictures',
          urls: picturesToStore(appData, saveData, replaced),
          // Only the full library list may prune what is stored.
          complete: !saveData,
        });
      })
      .catch(() => {});
  });
  return () => {
    cancelled = true;
    cancelIdle();
  };
}
