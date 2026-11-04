interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

/* The mark: a lifter pressing a loaded barbell overhead, kept to three parts
   (bar, head, a V for arms and body) so it holds at favicon size. Accent fill,
   same drawing as public/logo.svg. */
export function LogoMark({ size = 28, color = 'var(--color-volt)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden focusable="false" style={{ display: 'block' }}>
      <rect x="16" y="56" width="224" height="22" rx="11" fill={color} />
      <rect x="28" y="28" width="28" height="78" rx="14" fill={color} />
      <rect x="200" y="28" width="28" height="78" rx="14" fill={color} />
      <path
        d="M80 67L128 214L176 67"
        fill="none"
        stroke={color}
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="128" cy="112" r="18" fill={color} />
    </svg>
  );
}

export default function Logo({ className, withWordmark }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <LogoMark />
      {withWordmark && (
        <span
          style={{
            fontWeight: 800,
            letterSpacing: '-0.045em',
            fontSize: '1.5rem',
            lineHeight: 1,
            color: 'var(--color-text)',
          }}
        >
          liftgauge
        </span>
      )}
    </span>
  );
}
