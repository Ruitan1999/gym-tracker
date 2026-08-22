import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prefetchImages, resetPrefetchCache } from '../utils/prefetchImages';

/** Every Image the code under test constructed, in order. */
let created: { src: string }[] = [];

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

  it('does no work at all for an empty list', () => {
    const cancel = prefetchImages([null, null]);
    vi.runAllTimers();
    expect(created).toHaveLength(0);
    expect(() => cancel()).not.toThrow();
  });
});
