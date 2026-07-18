import React from 'react';
import { IconButton } from '@material-tailwind/react';

interface MobileMenuToggleProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileMenuToggle: React.FC<MobileMenuToggleProps> = ({ open, setOpen }) => (
  <IconButton
    variant="text"
    onClick={() => setOpen(!open)}
    className="lg:hidden text-gray-600 dark:text-gray-400"
  >
    {open ? (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ) : (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    )}
  </IconButton>
);

export default MobileMenuToggle;
