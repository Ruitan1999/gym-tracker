import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const RETRY_KEY = 'liftgauge.chunkRetry.v2';

function retryState(): { at: number; count: number } | null {
  const raw = localStorage.getItem(RETRY_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Stands in for window.location so the redirect can be observed. */
function stubLocation(href: string) {
  const replace = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href, replace, reload: vi.fn() },
  });
  return replace;
}

describe('reloadFresh', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates to a URL the cache has never seen', async () => {
    const replace = stubLocation('https://app.test/groups');
    const { reloadFresh } = await import('../utils/lazyWithRetry');

    reloadFresh();

    expect(replace).toHaveBeenCalledTimes(1);
    const target = new URL(replace.mock.calls[0][0] as string);
    // A plain reload can be served from cache; a new query string cannot.
    expect(target.searchParams.get('_fresh')).toBeTruthy();
    expect(target.pathname).toBe('/groups');
  });

  it('keeps any query the page already had', async () => {
    const replace = stubLocation('https://app.test/groups?foo=bar');
    const { reloadFresh } = await import('../utils/lazyWithRetry');

    reloadFresh();

    const target = new URL(replace.mock.calls[0][0] as string);
    expect(target.searchParams.get('foo')).toBe('bar');
  });
});

describe('tidyReloadMarker', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.resetModules();
  });

  it('takes the marker back out of the URL', async () => {
    stubLocation('https://app.test/groups?_fresh=abc&keep=1');
    const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    const { tidyReloadMarker } = await import('../utils/lazyWithRetry');

    tidyReloadMarker();

    const url = new URL(spy.mock.calls[0][2] as string);
    expect(url.searchParams.has('_fresh')).toBe(false);
    expect(url.searchParams.get('keep')).toBe('1');
    spy.mockRestore();
  });

  it('leaves a clean URL alone', async () => {
    stubLocation('https://app.test/groups');
    const spy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
    const { tidyReloadMarker } = await import('../utils/lazyWithRetry');

    tidyReloadMarker();

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('lazyWithRetry retry window', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.resetModules();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // The retry path deliberately never resolves — the navigation takes over —
  // so kick the loader off and let the microtask queue drain instead.
  type Lazy = { _payload: { _result: () => Promise<unknown> } };
  const startLoad = (component: unknown) => {
    const p = (component as Lazy)._payload._result();
    p.catch(() => {});
    return p;
  };
  const settle = () => new Promise((r) => setTimeout(r, 0));

  it('retries a failed chunk once, then stops', async () => {
    const replace = stubLocation('https://app.test/groups');
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = vi.fn(() => Promise.reject(new TypeError('Failed to fetch module')));

    startLoad(lazyWithRetry(factory));
    await settle();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(retryState()!.count).toBe(1);

    // A second failure inside the window must surface rather than loop.
    await expect(startLoad(lazyWithRetry(factory))).rejects.toThrow('Failed to fetch module');
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('still refuses to loop after the app is relaunched', async () => {
    // The reload the guard is meant to catch is the one that starts a new
    // session, so sessionStorage is empty by the time it counts. This is the
    // loop that sent an installed app round and round on its own.
    const replace = stubLocation('https://app.test/groups');
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = vi.fn(() => Promise.reject(new TypeError('Failed to fetch module')));

    startLoad(lazyWithRetry(factory));
    await settle();
    expect(replace).toHaveBeenCalledTimes(1);

    sessionStorage.clear();
    vi.resetModules();
    const { lazyWithRetry: relaunched } = await import('../utils/lazyWithRetry');

    await expect(startLoad(relaunched(factory))).rejects.toThrow('Failed to fetch module');
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh attempt once the window has passed', async () => {
    const replace = stubLocation('https://app.test/groups');
    // A retry recorded well in the past must not veto a later failure — that
    // left one flaky load poisoning the whole session.
    localStorage.setItem(
      RETRY_KEY,
      JSON.stringify({ at: Date.now() - 120_000, count: 1 }),
    );
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = vi.fn(() => Promise.reject(new TypeError('Failed to fetch module')));

    startLoad(lazyWithRetry(factory));
    await settle();

    expect(replace).toHaveBeenCalledTimes(1);
    expect(retryState()!.count).toBe(1);
  });

  it('clears the marker after a load succeeds', async () => {
    stubLocation('https://app.test/groups');
    localStorage.setItem(RETRY_KEY, JSON.stringify({ at: Date.now(), count: 1 }));
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = () => Promise.resolve({ default: () => null });

    await startLoad(lazyWithRetry(factory));

    expect(localStorage.getItem(RETRY_KEY)).toBeNull();
  });

  it('ignores a marker left behind in the old format', async () => {
    const replace = stubLocation('https://app.test/groups');
    localStorage.setItem(RETRY_KEY, 'not json');
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = vi.fn(() => Promise.reject(new TypeError('Failed to fetch module')));

    startLoad(lazyWithRetry(factory));
    await settle();

    expect(replace).toHaveBeenCalledTimes(1);
  });
});
