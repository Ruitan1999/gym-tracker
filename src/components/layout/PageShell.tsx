import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountMenu from './AccountMenu';

interface PageShellProps {
  title: string;
  rightAction?: ReactNode;
  children: ReactNode;
  showBack?: boolean;
}

export default function PageShell({ title, rightAction, children, showBack }: PageShellProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 min-h-[48px]">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center -ml-1 text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {rightAction}
          <AccountMenu />
        </div>
      </header>
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-4">
        {children}
      </main>
    </div>
  );
}
