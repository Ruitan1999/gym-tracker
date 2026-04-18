import { useState, useRef, useEffect } from 'react';
import { useMaybeAuth } from '../../context/AuthContext';

export default function AccountMenu() {
  const auth = useMaybeAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!auth) return null;
  const { user, logout } = auth;
  if (!user) return null;

  const label = user.isAnonymous ? 'Guest' : user.email || user.displayName || 'Account';
  const initial = (label[0] || '?').toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full bg-indigo-600 text-white font-semibold flex items-center justify-center"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
          <div className="px-3 py-2 text-xs text-gray-500 truncate">{label}</div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
