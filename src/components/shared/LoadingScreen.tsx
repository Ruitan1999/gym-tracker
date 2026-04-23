import Logo from './Logo';

export default function LoadingScreen() {
  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center"
      style={{ background: 'var(--color-bg)' }}
    >
      <Logo withWordmark />
      <div
        className="caps-tight text-[10px] mt-3 flex items-center"
        style={{ color: 'var(--color-text-muted)', letterSpacing: '0.18em' }}
      >
        LOADING
        <span className="progress-dots" aria-hidden>
          <span /><span /><span />
        </span>
      </div>
    </div>
  );
}
