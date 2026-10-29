import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * A round, icon-only link with a 48px target and a spoken name. `bordered`
 * gives it a surface and outline, for when it sits on the page background
 * rather than inside a card.
 */
export default function IconLink({
  to,
  label,
  icon,
  bordered = false,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  bordered?: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="shrink-0 w-12 h-12 flex items-center justify-center press"
      style={{
        borderRadius: '999px',
        color: 'var(--color-text)',
        ...(bordered
          ? { background: 'var(--color-surface)', border: '1px solid var(--color-line)' }
          : {}),
      }}
    >
      {icon}
    </Link>
  );
}
