import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import UpdateBanner from '../components/layout/UpdateBanner';
import { RUNNING_BUILD } from '../utils/buildVersion';

function respondWith(body: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({ ok, json: async () => body }) as unknown as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Lets the check's promise chain settle. */
const settle = () => act(async () => { await Promise.resolve(); await Promise.resolve(); });

describe('UpdateBanner', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('says nothing while the deployed build matches', async () => {
    respondWith({ build: RUNNING_BUILD });
    render(<UpdateBanner />);
    await settle();
    expect(screen.queryByText('UPDATE READY')).toBeNull();
  });

  it('offers a reload once the server has moved on', async () => {
    respondWith({ build: 'something-newer' });
    render(<UpdateBanner />);
    await settle();
    expect(screen.getByText('UPDATE READY')).toBeDefined();
    expect(screen.getByRole('button', { name: 'RELOAD' })).toBeDefined();
  });

  it('offers rather than reloads, so nothing on screen is lost', async () => {
    const replace = vi.fn();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ build: 'newer' }) }) as unknown as Response));
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: 'https://app.test/', replace, reload: vi.fn() },
    });

    render(<UpdateBanner />);
    await settle();

    expect(screen.getByText('UPDATE READY')).toBeDefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it('can be dismissed', async () => {
    respondWith({ build: 'newer' });
    render(<UpdateBanner />);
    await settle();

    act(() => {
      screen.getByRole('button', { name: 'Dismiss update notice' }).click();
    });
    expect(screen.queryByText('UPDATE READY')).toBeNull();
  });

  it('stays quiet when the server cannot be asked', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    render(<UpdateBanner />);
    await settle();
    expect(screen.queryByText('UPDATE READY')).toBeNull();
  });

  it('stays quiet when the answer is not a version at all', async () => {
    // An older deployment has no version.json, and the SPA rewrite hands back
    // the app's own HTML.
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => { throw new SyntaxError('Unexpected token <'); },
    }) as unknown as Response));
    render(<UpdateBanner />);
    await settle();
    expect(screen.queryByText('UPDATE READY')).toBeNull();
  });

  it('asks the server without letting a cache answer for it', async () => {
    const fetchMock = respondWith({ build: RUNNING_BUILD });
    render(<UpdateBanner />);
    await settle();
    expect(fetchMock).toHaveBeenCalledWith('/version.json', { cache: 'no-store' });
  });
});
