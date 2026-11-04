interface LogoProps {
  className?: string;
  withWordmark?: boolean;
}

/* The mark: a weight plate whose bore and needle are cut out, so it reads as
   a plate and as a gauge dial at once. One path, accent fill, holes show
   whatever sits behind it. Same drawing as public/logo.svg. */
const MARK_PATH =
  'M240 128A112 112 0 1 0 16 128A112 112 0 1 0 240 128ZM220 128A92 92 0 1 0 36 128A92 92 0 1 0 220 128ZM208 128A80 80 0 1 0 48 128A80 80 0 1 0 208 128ZM148.17 115L184 115A13 13 0 0 1 184 141L148.17 141A24 24 0 1 1 148.17 115Z';

export function LogoMark({ size = 28, color = 'var(--color-volt)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 256 256" aria-hidden focusable="false" style={{ display: 'block' }}>
      <path fill={color} fillRule="evenodd" transform="rotate(-45 128 128)" d={MARK_PATH} />
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
