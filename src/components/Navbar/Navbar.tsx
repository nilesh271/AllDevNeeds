import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Navbar as MTNavbar, Collapse, Typography } from '@material-tailwind/react';
import { useAppSelector } from '../../hooks/redux';
import NavLinkItem from './NavLinkItem';
import NavDropdown from './NavDropdown';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';
import MobileMenuToggle from './MobileMenuToggle';
import MobileMenu from './MobileMenu';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Dev Tools', path: '/dev-tools' },
  { label: 'Code Share', path: '/code' },
  { label: 'Notes', path: '/notes' },
  { label: 'Files', path: '/files', protected: true },
  { label: 'Learning', path: '/learning', protected: true },
  {
    label: 'Tools', children: [
      { label: 'DateTime', path: '/datetime' },
      { label: 'Video Downloader', path: '/video-downloader' },
    ]
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector(s => s.auth);

  const isActive = (path: string) => location.pathname === path;

  return (
    <MTNavbar
      className="fixed top-0 z-50 max-w-full rounded-none border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3"
      shadow={false}
    >
      {/* ── Desktop layout: 3-column grid so links sit in true center ── */}
      <div className="max-w-7xl mx-auto hidden lg:grid lg:grid-cols-[auto_1fr_auto] lg:items-center lg:gap-4">
        {/* Col 1 – Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 select-none">
          <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs">
            &lt;/&gt;
          </div>
          <Typography className="text-gray-900 dark:text-white font-bold text-lg leading-none">
            AllDevNeeds
          </Typography>
        </Link>

        {/* Col 2 – Centered nav links */}
        <div className="flex items-center justify-center gap-1">
          {NAV_LINKS.map(link => {
            if (link.children) {
              return <NavDropdown key={link.label} label={link.label} children={link.children} />;
            }
            if (link.protected && !isAuthenticated) return null;
            return (
              <NavLinkItem
                key={link.path}
                label={link.label}
                path={link.path!}
                isActive={isActive(link.path!)}
              />
            );
          })}
          {user?.role === 'admin' && (
            <NavLinkItem label="Admin" path="/admin" isActive={isActive('/admin')} />
          )}
        </div>

        {/* Col 3 – Right-side controls (Theme + Auth) */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <ThemeToggle />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 rounded-full text-sm font-semibold bg-sky-500 dark:bg-sky-500/80 hover:bg-sky-600 active:bg-sky-700 transition-colors duration-200 shadow-sm"
            >
              Login
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile layout ── */}
      <div className="lg:hidden">
        {/* Mobile header row: Logo | spacer | ThemeToggle + Hamburger */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-mono font-bold text-xs shrink-0">
              &lt;/&gt;
            </div>
            <Typography className="text-gray-900 dark:text-white font-bold text-lg leading-none">
              AllDevNeeds
            </Typography>
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <MobileMenuToggle open={open} setOpen={setOpen} />
          </div>
        </div>

        {/* Mobile dropdown panel */}
        <Collapse open={open}>
          <MobileMenu
            navLinks={NAV_LINKS}
            isActive={isActive}
            setOpen={setOpen}
            isAuthenticated={isAuthenticated}
            user={user}
            navigate={navigate}
          />
        </Collapse>
      </div>
    </MTNavbar>
  );
}
