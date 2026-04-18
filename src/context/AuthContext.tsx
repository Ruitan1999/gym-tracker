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
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInAnon: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    getRedirectResult(auth).catch((err) => {
      console.error('Redirect sign-in failed:', err);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const requireAuth = () => {
      if (!auth) throw new Error('Firebase is not configured. Set VITE_FIREBASE_* env vars.');
      return auth;
    };
    return {
      user,
      loading,
      configured: isFirebaseConfigured,
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
        if (isIOS || isStandalone) {
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
  }, [user, loading]);

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
