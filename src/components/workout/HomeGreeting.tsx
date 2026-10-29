import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { useMaybeAuth } from '../../context/AuthContext';

function deriveName(
  user: { isAnonymous?: boolean; displayName?: string | null; email?: string | null } | null,
): string {
  if (!user || user.isAnonymous) return 'friend';
  if (user.displayName) return user.displayName.split(' ')[0];
  if (user.email) {
    const local = user.email.split('@')[0].split(/[._-]/)[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return 'friend';
}

/**
 * The top of the home screen.
 *
 * Its own component so the Next Up card can sit directly under it, above the
 * momentum panel — the first thing on the screen should be what to do next,
 * not a record of what has been done.
 */
export default function HomeGreeting() {
  const auth = useMaybeAuth();
  const name = deriveName(auth?.user ?? null);

  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
      <div className="caps-tight text-[11px]" style={{ color: 'var(--color-text-faint)' }}>
        WELCOME, {name.toUpperCase()}
      </div>
      <h1
        className="font-display leading-tight mt-0.5"
        style={{
          fontSize: '1.625rem',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          fontVariationSettings: '"wdth" 90',
          color: 'var(--color-text)',
        }}
      >
        Let's get training today.
      </h1>
      </div>
      {/* Settings left the bottom bar for Plan; it lives here, one tap from Home. */}
      <Link
        to="/settings"
        aria-label="Settings"
        className="shrink-0 w-12 h-12 flex items-center justify-center press"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-line)',
          borderRadius: '999px',
          color: 'var(--color-text)',
        }}
      >
        <Settings size={20} strokeWidth={1.75} />
      </Link>
    </div>
  );
}
