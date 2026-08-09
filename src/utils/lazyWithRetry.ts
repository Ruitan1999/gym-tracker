/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, type ComponentType } from 'react';

const RELOAD_FLAG = 'liftgauge.chunkReload.v1';

function readFlag(): boolean {
  try {
    return sessionStorage.getItem(RELOAD_FLAG) !== null;
  } catch {
    return false;
  }
}

function writeFlag(): void {
  try {
    sessionStorage.setItem(RELOAD_FLAG, '1');
  } catch {
    /* private mode — we just lose the loop guard */
  }
}

function clearFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    /* ignore */
  }
}

/**
 * A route that fails to load leaves Suspense showing its fallback forever —
 * a blank screen with nothing to act on. This happens for real: a deploy
 * replaces the hashed chunks, and a browser still holding the previous
 * index.html asks for filenames that no longer exist.
 *
 * One reload fetches the current index.html and its chunk names. A flag stops
 * it looping if the chunk is missing for some other reason.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      clearFlag();
      return mod;
    } catch (err) {
      if (readFlag()) throw err;
      writeFlag();
      window.location.reload();
      // The reload takes over; never resolve, so nothing renders in the meantime.
      return new Promise<{ default: T }>(() => {});
    }
  });
}
