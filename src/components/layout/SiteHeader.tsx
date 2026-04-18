import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../shared/Logo';

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const onLogin = location.pathname === '/login';

  return (
    <>
      {/* top ticker strip */}
      <div className="fixed top-0 inset-x-0 h-[3px] z-50" style={{ background: 'var(--color-volt)' }} />

      <header
        className="sticky top-[3px] z-40"
        style={{
          background: 'var(--color-bg)',
          borderBottom: '1px solid var(--color-line)',
          paddingTop: 'var(--safe-top)',
        }}
      >
        <div className="max-w-[1100px] mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="press inline-flex items-center"
            aria-label="liftgauge home"
          >
            <Logo withWordmark />
          </button>
          <div className="flex items-center gap-2">
            {onLogin ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="h-9 px-3 inline-flex items-center caps-tight text-[10px] press"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ← BACK TO SITE
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex h-9 px-3 items-center caps-tight text-[10px] press"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="h-9 px-4 btn-volt press caps-tight text-[10px] inline-flex items-center"
                  style={{ borderRadius: '2px' }}
                >
                  GET STARTED →
                </button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
