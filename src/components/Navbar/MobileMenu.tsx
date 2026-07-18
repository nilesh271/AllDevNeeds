import React from 'react';
import { Link } from 'react-router-dom';

interface NavChild {
  label: string;
  path: string;
}

interface NavLink {
  label: string;
  path?: string;
  protected?: boolean;
  children?: NavChild[];
}

interface MobileMenuProps {
  navLinks: NavLink[];
  isActive: (path: string) => boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAuthenticated: boolean;
  user: any;
  navigate: (path: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  navLinks,
  isActive,
  setOpen,
  isAuthenticated,
  user,
  navigate,
}) => (
  <div className="flex flex-col pt-2 pb-3">
    {/* Nav links */}
    <nav className="flex flex-col gap-0.5 px-2">
      {navLinks.map(link => {
        if (link.children) {
          return (
            <div key={link.label} className="mt-2">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest px-3 pb-1">
                {link.label}
              </p>
              {link.children.map(child => (
                <Link
                  key={child.path}
                  to={child.path}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                    isActive(child.path) ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 font-medium' : ''
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          );
        }
        if (link.protected && !isAuthenticated) return null;
        return (
          <Link
            key={link.path}
            to={link.path!}
            className={`flex items-center px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              isActive(link.path!) ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 font-medium' : ''
            }`}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        );
      })}

      {user?.role === 'admin' && (
        <Link
          to="/admin"
          className={`flex items-center px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
            isActive('/admin') ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20 font-medium' : ''
          }`}
          onClick={() => setOpen(false)}
        >
          Admin
        </Link>
      )}
    </nav>

    {/* Auth section – pinned at the bottom with a divider */}
    {!isAuthenticated && (
      <>
        <div className="my-3 border-t border-gray-200 dark:border-gray-700" />
        <div className="flex gap-2 px-2">
          <button
            className="flex-1 text-sm font-semibold py-2 rounded-full bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white transition-colors"
            onClick={() => { navigate('/login'); setOpen(false); }}
          >
            Login
          </button>
          <button
            className="flex-1 text-sm font-medium py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white transition-colors"
            onClick={() => { navigate('/signup'); setOpen(false); }}
          >
            Sign up
          </button>
        </div>
      </>
    )}
  </div>
);

export default MobileMenu;
