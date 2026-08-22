import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describeAuthError } from '../context/AuthContext';

/** Hand control of both async auth signals to the test. */
const state: {
  emitUser: (u: unknown) => void;
  resolveRedirect: (v: unknown) => void;
  rejectRedirect: (e: unknown) => void;
} = {
  emitUser: () => {},
  resolveRedirect: () => {},
  rejectRedirect: () => {},
};

vi.mock('../firebase/config', () => ({
  auth: { __fake: true },
  db: null,
  isFirebaseConfigured: true,
}));

vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class {},
  deleteUser: vi.fn(),
  signInAnonymously: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
  signInWithRedirect: vi.fn(),
  signOut: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  getRedirectResult: () =>
    new Promise((resolve, reject) => {
      state.resolveRedirect = resolve;
      state.rejectRedirect = reject;
    }),
  onAuthStateChanged: (_a: unknown, cb: (u: unknown) => void) => {
    state.emitUser = cb;
    return () => {};
  },
}));

vi.mock('firebase/firestore', () => ({ deleteDoc: vi.fn(), doc: vi.fn() }));

let AuthProvider: (p: { children: ReactNode }) => ReactNode;
let useAuth: () => { user: unknown; loading: boolean; authError: string | null };

beforeEach(async () => {
  vi.resetModules();
  const mod = await import('../context/AuthContext');
  AuthProvider = mod.AuthProvider as typeof AuthProvider;
  useAuth = mod.useAuth as typeof useAuth;
});

afterEach(() => vi.clearAllMocks());

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('coming back from a redirect sign-in', () => {
  it('does not call you signed out while the redirect is still being collected', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Firebase reports nobody first — it always does, before the redirect
    // result has been read back.
    await act(async () => state.emitUser(null));

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('signs you in when the redirect finally produces a user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => state.emitUser(null));
    await act(async () => {
      state.resolveRedirect({ user: { uid: 'u1' } });
      state.emitUser({ uid: 'u1' });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toEqual({ uid: 'u1' });
  });

  it('settles on signed-out once the redirect comes back with nobody', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => state.emitUser(null));
    await act(async () => state.resolveRedirect(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it('stops waiting, and says why, when the redirect fails', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => state.emitUser(null));
    await act(async () => state.rejectRedirect({ code: 'auth/unauthorized-domain' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.authError).toContain('authorised domains');
  });

  it('does not hold up someone already signed in', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // A returning visit with a live session: no redirect pending, and the
    // app should not sit on a loading screen waiting for one.
    await act(async () => state.emitUser({ uid: 'u1' }));

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toEqual({ uid: 'u1' });
  });
});

describe('describeAuthError', () => {
  it('names the domain list, which is the one nobody guesses', () => {
    expect(describeAuthError({ code: 'auth/unauthorized-domain' })).toContain(
      'Authorized domains',
    );
  });

  it('still shows an unrecognised code rather than swallowing it', () => {
    expect(describeAuthError({ code: 'auth/weird' })).toBe('Sign-in failed (auth/weird).');
  });

  it('copes with a throw carrying no code', () => {
    expect(describeAuthError(new Error('boom'))).toBe('Sign-in failed.');
    expect(describeAuthError(undefined)).toBe('Sign-in failed.');
  });
});
