import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SignInPage() {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInAnon, configured } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const handleProvider = async (fn: () => Promise<void>) => {
    setError(null);
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 space-y-3">
          <h1 className="text-xl font-semibold">Firebase not configured</h1>
          <p className="text-sm text-slate-600">
            Copy <code>.env.example</code> to <code>.env.local</code>, fill in your Firebase web
            app config from the Firebase Console, and reload the dev server.
          </p>
          <p className="text-sm text-slate-600">
            See <code>SETUP.md</code> for a step-by-step walkthrough.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Gym Tracker</h1>
          <p className="text-sm text-slate-600">
            Sign in so your workouts sync across devices.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleProvider(signInWithGoogle)}
          disabled={busy}
          className="w-full h-11 rounded-lg border border-slate-300 font-medium hover:bg-slate-50 disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs text-slate-500 uppercase">or</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (6+ chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full h-11 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          className="text-sm text-indigo-600 hover:underline w-full text-center"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>

        <button
          type="button"
          onClick={() => handleProvider(signInAnon)}
          disabled={busy}
          className="text-sm text-slate-500 hover:underline w-full text-center"
        >
          Continue as guest
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-2 rounded" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
