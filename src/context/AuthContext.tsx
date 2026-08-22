import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  GoogleAuthProvider,
  deleteUser,
  getRedirectResult,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { deleteDoc, doc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase/config';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  /** A redirect sign-in that came back and failed, in words. */
  authError: string | null;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInAnon: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * A sign-in that fails on the way back from Google leaves you on the sign-in
 * page with nothing said, which is indistinguishable from never having tried.
 * These are the codes that actually come up, in words worth reading.
 */
export function describeAuthError(err: unknown): string {
  const code = (err as { code?: unknown })?.code;
  switch (typeof code === 'string' ? code : '') {
    case 'auth/unauthorized-domain':
      return 'This site is not on the Firebase project\'s list of authorised domains, so sign-in was refused. Add it under Authentication → Settings → Authorized domains.';
    case 'auth/web-storage-unsupported':
    case 'auth/operation-not-supported-in-this-environment':
      return 'This browser is blocking the storage sign-in needs. Try again outside a private window, or with cross-site tracking prevention off for this site.';
    case 'auth/missing-or-invalid-nonce':
    case 'auth/invalid-credential':
      return 'The sign-in came back but could not be verified. Try again.';
    case 'auth/account-exists-with-different-credential':
      return 'There is already an account with that email, created a different way. Sign in the way you did the first time.';
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Wait a moment and try again.';
    case 'auth/popup-blocked':
      return 'The sign-in window was blocked. Allow pop-ups for this site, or try again.';
    default:
      return typeof code === 'string' && code
        ? `Sign-in failed (${code}).`
        : 'Sign-in failed.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  /** Firebase has told us who is signed in, even if that is nobody. */
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  /** Any pending redirect sign-in has been collected, successfully or not. */
  const [redirectDone, setRedirectDone] = useState(!isFirebaseConfigured);
  const [redirectError, setRedirectError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      setRedirectDone(true);
      return;
    }
    let cancelled = false;

    // Coming back from Google, onAuthStateChanged fires with nobody signed in
    // before the redirect has been collected. Taken as final that renders the
    // sign-in page — which is what you land back on, having just signed in.
    getRedirectResult(auth)
      .catch((err) => {
        console.error('Redirect sign-in failed:', err);
        if (!cancelled) setRedirectError(describeAuthError(err));
      })
      .finally(() => {
        if (!cancelled) setRedirectDone(true);
      });

    const unsub = onAuthStateChanged(auth, (u) => {
      if (cancelled) return;
      setUser(u);
      setAuthReady(true);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  // Nobody signed in is only an answer once the redirect has been collected.
  const loading = !authReady || (!user && !redirectDone);

  const value = useMemo<AuthContextValue>(() => {
    const requireAuth = () => {
      if (!auth) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* env vars.');
      return auth;
    };
    return {
      user,
      loading,
      configured: isFirebaseConfigured,
      authError: redirectError,
      clearAuthError: () => setRedirectError(null),
      signInWithGoogle: async () => {
        const a = requireAuth();
        const provider = new GoogleAuthProvider();
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        const isIOS = /iPad|iPhone|iPod/.test(ua);
        const isStandalone =
          typeof window !== 'undefined' &&
          // iOS PWA
          ((window.navigator as unknown as { standalone?: boolean }).standalone === true ||
            window.matchMedia?.('(display-mode: standalone)').matches);
        // Redirect sign-in depends on storage shared with the Firebase auth
        // domain, which browsers now partition — it can come back with nobody
        // signed in and no error, landing you back here. So it is kept for the
        // one case with no usable popup: an iOS app opened from the home
        // screen, where a popup escapes to Safari and the result never returns.
        if (isIOS && isStandalone) {
          await signInWithRedirect(a, provider);
          return;
        }
        try {
          await signInWithPopup(a, provider);
        } catch (err) {
          const code = (err as { code?: string } | null)?.code ?? '';
          if (
            code === 'auth/popup-blocked' ||
            code === 'auth/popup-closed-by-user' ||
            code === 'auth/operation-not-supported-in-this-environment'
          ) {
            await signInWithRedirect(a, provider);
            return;
          }
          throw err;
        }
      },
      signInWithEmail: async (email, password) => {
        const a = requireAuth();
        await signInWithEmailAndPassword(a, email, password);
      },
      signUpWithEmail: async (email, password) => {
        const a = requireAuth();
        await createUserWithEmailAndPassword(a, email, password);
      },
      signInAnon: async () => {
        const a = requireAuth();
        await signInAnonymously(a);
      },
      sendPasswordReset: async (email) => {
        const a = requireAuth();
        await sendPasswordResetEmail(a, email);
      },
      logout: async () => {
        const a = requireAuth();
        await signOut(a);
      },
      deleteAccount: async () => {
        const a = requireAuth();
        const current = a.currentUser;
        if (!current) throw new Error('No user is signed in.');
        if (db) {
          try {
            await deleteDoc(doc(db, 'users', current.uid));
          } catch (err) {
            console.error('Failed to delete user data:', err);
          }
        }
        await deleteUser(current);
        try {
          await signOut(a);
        } catch {
          // user already cleared by deleteUser
        }
      },
    };
  }, [user, loading, redirectError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useMaybeAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}
