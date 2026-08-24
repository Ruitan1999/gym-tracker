import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prefetchImages, awaitImages, resetPrefetchCache } from '../utils/prefetchImages';

/** Every Image the code under test constructed, in order. */
let created: { src: string; onload?: (() => void) | null; onerror?: (() => void) | null }[] = [];

beforeEach(() => {
  resetPrefetchCache();
  created = [];
  vi.useFakeTimers();
  // jsdom's Image does not fetch, which is all this needs: what matters is
  // which URLs were asked for, and when.
  vi.stubGlobal(
    'Image',
    class {
      decoding = '';
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      #src = '';
      get src() {
        return this.#src;
      }
      set src(value: string) {
        this.#src = value;
        created.push(this);
      }
    },
  );
  vi.stubGlobal('requestIdleCallback', undefined);
  vi.stubGlobal('cancelIdleCallback', undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('prefetchImages', () => {
  it('asks for each picture once the browser is idle, not before', () => {
    prefetchImages(['/a.jpg', '/b.jpg']);
    expect(created).toHaveLength(0);

    vi.runAllTimers();

    expect(created.map((i) => i.src)).toEqual(['/a.jpg', '/b.jpg']);
  });

  it('skips the ones with no picture', () => {
    prefetchImages(['/a.jpg', null, '/b.jpg', null]);
    vi.runAllTimers();
    expect(created.map((i) => i.src)).toEqual(['/a.jpg', '/b.jpg']);
  });

  it('never asks for the same picture twice', () => {
    prefetchImages(['/a.jpg', '/b.jpg']);
    vi.runAllTimers();
    prefetchImages(['/a.jpg', '/c.jpg']);
    vi.runAllTimers();

    expect(created.map((i) => i.src)).toEqual(['/a.jpg', '/b.jpg', '/c.jpg']);
  });

  it('stops at the limit rather than pulling a whole catalog', () => {
    prefetchImages(
      Array.from({ length: 50 }, (_, i) => `/img-${i}.jpg`),
      5,
    );
    vi.runAllTimers();
    expect(created).toHaveLength(5);
  });

  it('fetches nothing once cancelled', () => {
    const cancel = prefetchImages(['/a.jpg']);
    cancel();
    vi.runAllTimers();
    expect(created).toHaveLength(0);
  });

  it('fetches nothing when the device has asked to save data', () => {
    vi.stubGlobal('navigator', { connection: { saveData: true } });

    prefetchImages(['/a.jpg', '/b.jpg']);
    vi.runAllTimers();

    expect(created).toHaveLength(0);
  });

  it('still fetches after a cancelled attempt for the same pictures', () => {
    // What an effect does on a dependency change: cleanup, then run again.
    // If the first attempt marked these as asked-for and the cancel did not
    // take it back, the second attempt finds nothing to do and the pictures
    // are never fetched at all.
    const cancel = prefetchImages(['/a.jpg', '/b.jpg']);
    cancel();

    prefetchImages(['/a.jpg', '/b.jpg']);
    vi.runAllTimers();

    expect(created.map((i) => i.src)).toEqual(['/a.jpg', '/b.jpg']);
  });

  it('does no work at all for an empty list', () => {
    const cancel = prefetchImages([null, null]);
    vi.runAllTimers();
    expect(created).toHaveLength(0);
    expect(() => cancel()).not.toThrow();
  });
});

describe('awaitImages', () => {
  it('resolves once every picture has settled', async () => {
    const p = awaitImages(['/a.jpg', '/b.jpg']);
    created.forEach((i) => i.onload?.());
    await expect(p).resolves.toBeUndefined();
  });

  it('resolves anyway when a picture never arrives', async () => {
    const p = awaitImages(['/slow.jpg'], 500);
    // Nothing settles; the clock is what lets the app get on with it.
    vi.advanceTimersByTime(600);
    await expect(p).resolves.toBeUndefined();
  });

  it('does not wait on a picture that fails', async () => {
    const p = awaitImages(['/gone.jpg']);
    created.forEach((i) => i.onerror?.());
    await expect(p).resolves.toBeUndefined();
  });

  it('has nothing to wait for when there are no pictures', async () => {
    await expect(awaitImages([null, null])).resolves.toBeUndefined();
    expect(created).toHaveLength(0);
  });
});
