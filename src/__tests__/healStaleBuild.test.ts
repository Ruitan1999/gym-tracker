import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RUNNING_BUILD, clearStaleReload, healStaleBuildOnBoot } from '../utils/buildVersion';

const STALE_KEY = 'liftgauge.staleReload.v1';

function serverSays(build: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ build }) }) as unknown as Response),
  );
}

/** The reload replaces the document, so it is only observable as a call. */
function stubLocation() {
  const replace = vi.fn();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'https://app.test/', replace, reload: vi.fn() },
  });
  return replace;
}

beforeEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearStaleReload();
});

describe('a document that came back from a cache', () => {
  it('reloads itself when the server has moved on', async () => {
    const replace = stubLocation();
    serverSays('a-newer-build');

    expect(await healStaleBuildOnBoot()).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
    // Cache-busted: the same URL is exactly what the stale copy is filed under.
    expect(String(replace.mock.calls[0][0])).toContain('_fresh=');
  });

  it('leaves a current build alone', async () => {
    const replace = stubLocation();
    serverSays(RUNNING_BUILD);

    expect(await healStaleBuildOnBoot()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('does not reload twice for the same mismatch', async () => {
    const replace = stubLocation();
    serverSays('a-newer-build');

    await healStaleBuildOnBoot();
    // The relaunch that follows: still behind, because reloading was not the
    // fix. Bouncing the app again would be a loop, so the banner takes over.
    expect(await healStaleBuildOnBoot()).toBe(false);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('heals again once an old attempt has aged out', async () => {
    const replace = stubLocation();
    serverSays('a-newer-build');
    localStorage.setItem(STALE_KEY, String(Date.now() - 10 * 60_000));

    expect(await healStaleBuildOnBoot()).toBe(true);
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it('stays put when the server cannot be asked', async () => {
    const replace = stubLocation();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));

    expect(await healStaleBuildOnBoot()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it('clears a spent guard once the running build is confirmed current', async () => {
    stubLocation();
    localStorage.setItem(STALE_KEY, String(Date.now()));
    serverSays(RUNNING_BUILD);

    await healStaleBuildOnBoot();
    expect(localStorage.getItem(STALE_KEY)).toBeNull();
  });
});
