import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * The uid list is read once when the module loads, so each case has to import
 * it fresh — which is also what happens in the browser, where the list is baked
 * into the bundle at build time.
 */
async function load(value?: string) {
  vi.resetModules();
  if (value === undefined) vi.stubEnv('VITE_ADMIN_UIDS', '');
  else vi.stubEnv('VITE_ADMIN_UIDS', value);
  return import('../utils/admin');
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('isAdmin', () => {
  it('recognises the listed uid', async () => {
    const { isAdmin } = await load('abc123');
    expect(isAdmin('abc123')).toBe(true);
  });

  it('recognises any of several, however they are spaced', async () => {
    const { isAdmin } = await load(' abc123 , def456');
    expect(isAdmin('abc123')).toBe(true);
    expect(isAdmin('def456')).toBe(true);
  });

  it('turns nobody away as an admin when the list is empty', async () => {
    const { isAdmin } = await load('');
    expect(isAdmin('abc123')).toBe(false);
  });

  it('needs the whole uid, not a piece of it', async () => {
    const { isAdmin } = await load('abc123');
    expect(isAdmin('abc')).toBe(false);
    expect(isAdmin('abc1234')).toBe(false);
  });

  it('never admits a missing uid, even against a stray empty entry', async () => {
    const { isAdmin } = await load('abc123,,');
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin('')).toBe(false);
  });

  it('does not match a quoted value to the bare uid', async () => {
    // Pasting "abc123" with the quotes into a deploy config is an easy mistake,
    // and it must fail closed rather than half-work.
    const { isAdmin } = await load('"abc123"');
    expect(isAdmin('abc123')).toBe(false);
  });
});

describe('adminConfigured', () => {
  it('says so when the build was given a uid', async () => {
    const { adminConfigured } = await load('abc123');
    expect(adminConfigured()).toBe(true);
  });

  it('says so when it was not, so a missing screen can be explained', async () => {
    const { adminConfigured } = await load('');
    expect(adminConfigured()).toBe(false);
    expect((await load('  ,  ')).adminConfigured()).toBe(false);
  });
});
