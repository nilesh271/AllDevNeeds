import React from 'react';
import { Menu, MenuHandler, MenuList, MenuItem } from '@material-tailwind/react';
import { useNavigate } from 'react-router-dom';

interface NavDropdownProps {
  label: string;
  children: Array<{ label: string; path: string }>;
}

const NavDropdown: React.FC<NavDropdownProps> = ({ label, children }) => {
  const navigate = useNavigate();
  return (
    <Menu allowHover>
      <MenuHandler>
        <button className="nav-link px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1">
          {label}
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </MenuHandler>
      <MenuList className="dark:bg-gray-800 dark:border-gray-700">
        {children.map((child) => (
          <MenuItem
            key={child.path}
            onClick={() => navigate(child.path)}
            className="dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {child.label}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};

export default NavDropdown;
