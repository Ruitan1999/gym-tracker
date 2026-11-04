interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

/* The mark: a lifter pressing a loaded barbell overhead, all hard edges:
   square-cut bar and plates, arms cut flush into the bar and a sharp
   inverted-triangle torso and a diamond head. Accent fill, same drawing
   as public/logo.svg. */
export function LogoMark({ size = 28, color = 'var(--color-volt)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden focusable="false" style={{ display: 'block' }}>
      <rect x="12" y="52" width="232" height="20" fill={color} />
      <rect x="24" y="20" width="26" height="84" fill={color} />
      <rect x="206" y="20" width="26" height="84" fill={color} />
      <path d="M60.4 72H83.6L106.9 142H83.7Z M195.6 72H172.4L149.1 142H172.3Z" fill={color} />
      <path d="M128 84L152 108L128 132L104 108Z" fill={color} />
      <path d="M82 142H174L128 240Z" fill={color} />
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
