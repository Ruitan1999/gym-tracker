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
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInAnon: () => Promise<void>;
  logout: () => Promise<void>;
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
        await signInWithPopup(a, new GoogleAuthProvider());
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
      logout: async () => {
        const a = requireAuth();
        await signOut(a);
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
