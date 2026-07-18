import React from 'react';
import { Avatar, Chip, Menu, MenuHandler, MenuList, MenuItem, Button } from '@material-tailwind/react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/authSlice';
import { useNavigate } from 'react-router-dom';

const UserMenu: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { dark } = useAppSelector((s) => s.theme);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <Menu>
      <MenuHandler>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar
            size="sm"
            src={`https://api.dicebear.com/8.x/initials/svg?seed=${user?.username}&backgroundColor=0ea5e9`}
            className="cursor-pointer"
          />
          {user?.role === 'admin' && (
            <Chip value="Admin" size="sm" color="sky" className="hidden sm:flex py-0.5" />
          )}
        </div>
      </MenuHandler>
      <MenuList className="dark:bg-gray-800 dark:border-gray-700 z-[9999]">
        <MenuItem className="dark:text-gray-300">
          <span className="font-medium">{user?.username}</span>
        </MenuItem>
        <hr className="my-1 border-gray-200 dark:border-gray-700" />
        <MenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400 dark:hover:bg-gray-700">
          Sign out
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default UserMenu;
