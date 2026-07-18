import { Link } from 'react-router-dom';
import React from 'react';

interface NavLinkItemProps {
  label: string;
  path: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavLinkItem: React.FC<NavLinkItemProps> = ({ label, path, isActive, onClick }) => (
  <Link
    to={path}
    onClick={onClick}
    className={`nav-link px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
      isActive ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20' : ''
    }`}
  >
    {label}
  </Link>
);

export default NavLinkItem;
