interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export default function Logo({ className, withWordmark }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        fill="none"
        className="w-7 h-7"
        aria-hidden="true"
      >
        <path d="M8 34 L24 22 L40 34" stroke="var(--color-text)" strokeOpacity="0.35" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 26 L24 14 L40 26" stroke="var(--color-text)" strokeOpacity="0.65" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 18 L24 6 L40 18" stroke="var(--color-volt)" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withWordmark && (
        <span
          className="inline-flex items-baseline"
          style={{ fontWeight: 800, letterSpacing: '-0.045em', fontSize: '1.5rem', lineHeight: 1 }}
        >
          <span style={{ color: 'var(--color-text)' }}>lift</span>
          <span style={{ color: 'var(--color-text)' }}>gauge</span>
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: '0.35em',
              height: '0.35em',
              borderRadius: '999px',
              background: 'var(--color-volt)',
              marginLeft: '0.2em',
              transform: 'translateY(-0.1em)',
            }}
          />
        </span>
      )}
    </span>
  );
}
