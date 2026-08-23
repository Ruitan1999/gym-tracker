/**
 * An exercise's picture at a fixed size, or the space where one would be.
 *
 * The placeholder is deliberate rather than nothing: a list where some rows
 * have a picture and some collapse to text alone reads as broken, and the
 * library has exercises with no picture on purpose.
 */
export default function ExerciseThumb({
  src,
  size = 44,
}: {
  src: string | null;
  size?: number;
}) {
  const shared = {
    width: size,
    height: size,
    borderRadius: 'var(--radius)',
    background: 'var(--color-line-2)',
  } as const;

  if (!src) return <span className="shrink-0" style={{ ...shared, opacity: 0.4 }} aria-hidden />;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      decoding="async"
      width={size}
      height={size}
      className="shrink-0"
      style={{ ...shared, objectFit: 'cover' }}
    />
  );
}
