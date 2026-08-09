import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

const RETRY_KEY = 'liftgauge.chunkRetry.v1';

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
    expect(sessionStorage.getItem(RETRY_KEY)).toBeTruthy();

    // A second failure inside the window must surface rather than loop.
    await expect(startLoad(lazyWithRetry(factory))).rejects.toThrow('Failed to fetch module');
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('allows a fresh attempt once the window has passed', async () => {
    const replace = stubLocation('https://app.test/groups');
    // A retry recorded well in the past must not veto a later failure — that
    // left one flaky load poisoning the whole session.
    sessionStorage.setItem(RETRY_KEY, String(Date.now() - 60_000));
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = vi.fn(() => Promise.reject(new TypeError('Failed to fetch module')));

    startLoad(lazyWithRetry(factory));
    await settle();

    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('clears the marker after a load succeeds', async () => {
    stubLocation('https://app.test/groups');
    sessionStorage.setItem(RETRY_KEY, String(Date.now()));
    const { lazyWithRetry } = await import('../utils/lazyWithRetry');
    const factory = () => Promise.resolve({ default: () => null });

    await startLoad(lazyWithRetry(factory));

    expect(sessionStorage.getItem(RETRY_KEY)).toBeNull();
  });
});
