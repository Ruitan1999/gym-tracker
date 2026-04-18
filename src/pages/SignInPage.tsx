import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/shared/Logo';

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
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          className="max-w-md w-full p-6 space-y-3"
          style={{
            background: 'var(--color-elev)',
            border: '1px solid var(--color-line-2)',
            borderRadius: '2px',
          }}
        >
          <div className="caps-tight text-[9px]" style={{ color: 'var(--color-rust)' }}>
            ERR CONFIG
          </div>
          <h1
            className="font-display"
            style={{ fontSize: '1.375rem', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--color-text)' }}
          >
            Firebase not configured
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            Copy <code className="font-mono">.env.example</code> to{' '}
            <code className="font-mono">.env.local</code>, fill in your Firebase config, and reload.
          </p>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            See <code className="font-mono">SETUP.md</code> for the walkthrough.
          </p>
        </div>
      </div>
    );
  }

  const inputStyle = {
    background: 'var(--color-ink)',
    border: '1px solid var(--color-line-2)',
    borderRadius: '2px',
    color: 'var(--color-text)',
    fontSize: '16px',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      {/* ticker strip */}
      <div
        className="absolute top-0 inset-x-0 h-[3px]"
        style={{ background: 'var(--color-volt)' }}
      />
      <div className="max-w-md w-full space-y-5">
        <div className="space-y-3">
          <Logo withWordmark />
          <h1
            className="font-display"
            style={{
              fontSize: '2rem',
              fontWeight: 700,
              letterSpacing: '-0.035em',
              lineHeight: 1.05,
              color: 'var(--color-text)',
            }}
          >
            Sign in to sync<br />your training.
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            Workouts sync across devices. Data stays yours.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleProvider(signInWithGoogle)}
          disabled={busy}
          className="w-full h-12 press caps-tight text-[11px] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-line-2)',
            borderRadius: '2px',
            color: 'var(--color-text)',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4" aria-hidden>
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: 'var(--color-line)' }} />
          <span className="caps-tight text-[9px]" style={{ color: 'var(--color-text-faint)' }}>
            OR EMAIL
          </span>
          <div className="h-px flex-1" style={{ background: 'var(--color-line)' }} />
        </div>

        <form onSubmit={submit} className="space-y-2.5">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 px-3 outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password 6+ chars"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 px-3 outline-none"
            style={inputStyle}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 btn-volt press caps-tight text-[11px] disabled:opacity-40"
            style={{ borderRadius: '2px' }}
          >
            {mode === 'signin' ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          className="caps-tight text-[10px] w-full text-center press"
          style={{ color: 'var(--color-text)' }}
        >
          {mode === 'signin' ? 'NO ACCOUNT? SIGN UP' : 'HAVE ACCOUNT? SIGN IN'}
        </button>

        <button
          type="button"
          onClick={() => handleProvider(signInAnon)}
          disabled={busy}
          className="caps-tight text-[10px] w-full text-center press"
          style={{ color: 'var(--color-text-faint)' }}
        >
          CONTINUE AS GUEST
        </button>

        {error && (
          <p
            className="text-[12px] p-3"
            role="alert"
            style={{
              color: 'var(--color-rust)',
              border: '1px solid var(--color-rust)',
              background: 'rgba(211, 78, 54, 0.06)',
              borderRadius: '2px',
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
