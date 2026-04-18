interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

export default function Logo({ className, withWordmark }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ''}`}>
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
