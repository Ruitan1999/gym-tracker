interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

/* The mark: a lifter pressing a loaded barbell overhead, with a sharp
   inverted-triangle torso. Accent fill, same
   drawing as public/logo.svg. */
export function LogoMark({ size = 28, color = 'var(--color-volt)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden focusable="false" style={{ display: 'block' }}>
      <rect x="12" y="52" width="232" height="20" rx="10" fill={color} />
      <rect x="24" y="20" width="26" height="84" rx="12" fill={color} />
      <rect x="206" y="20" width="26" height="84" rx="12" fill={color} />
      <path d="M70 66L98 150M186 66L158 150" fill="none" stroke={color} strokeWidth="22" strokeLinecap="round" />
      <circle cx="128" cy="110" r="21" fill={color} />
      <path d="M87 142H169L128 240Z" fill={color} />
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
