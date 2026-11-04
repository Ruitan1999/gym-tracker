import { useNavigate, useLocation } from 'react-router-dom';
import Logo from '../shared/Logo';

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const onLogin = location.pathname === '/login';

  return (
    <>
      <header
        className="sticky top-0 z-40"
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
                className="h-9 px-3 inline-flex items-center caps-tight press"
                style={{ color: 'var(--color-text-muted)' }}
              >
                ← BACK TO SITE
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex h-9 px-3 items-center caps-tight press"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  SIGN IN
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="h-9 px-4 btn-volt press caps-tight inline-flex items-center"
                  style={{ borderRadius: 'var(--radius)' }}
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
