import { useState, useEffect } from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  Accordion,
  AccordionHeader,
  AccordionBody,
} from "@material-tailwind/react";
import { BsChevronDown, BsFillClockFill, BsFillCompassFill, BsFillFileEarmarkFontFill, BsFillLightningChargeFill, BsLockFill } from "react-icons/bs";
import { Link, useLocation } from "react-router-dom";

type IconId = 'dashboard' | 'generators' | 'textTools' | 'security' | 'datetime'
 
interface MenuItem {
  iconId?: string;
  label: string;
  path?: string;
  children?: MenuItem[];
}
interface SidebarMenuProps {
  title: string;
  menuItems: MenuItem[];
  mobile?: boolean;
  onNavigate?: () => void;
}

const iconIds = {
  dashboard: <BsFillCompassFill className="h-5 w-5" />,
  generators: <BsFillLightningChargeFill className="h-5 w-5" />,
  textTools: <BsFillFileEarmarkFontFill className="h-5 w-5" />,
  security: <BsLockFill className="h-5 w-5" />,
  datetime: <BsFillClockFill className="h-5 w-5" />
}

const hasIcon = (iconId?: string): iconId is IconId =>
  Boolean(iconId && iconId in iconIds)

interface SingleListItemProps extends MenuItem {
  isChild?: boolean;
  isActive: boolean;
  onNavigate?: () => void;
}

function SingleListItem({ iconId, label, path, isChild, isActive, onNavigate }: SingleListItemProps) {
  return (
    <Link to={path || ''} onClick={onNavigate}>
      <ListItem
        className={[
          'mr-auto transition-colors duration-150 rounded-l-none border-l-[3px]',
          isChild ? 'pl-10 font-normal' : 'pl-4 font-semibold',
          isActive
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400'
            : 'border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60',
        ].join(' ')}
      >
        {hasIcon(iconId) ? (
          <ListItemPrefix className={isActive ? 'text-sky-500' : 'text-gray-500 dark:text-gray-400'}>
            {iconIds[iconId]}
          </ListItemPrefix>
        ) : ''}
        <Typography
          className={[
            !isChild ? 'font-semibold' : 'font-medium',
            'text-sm',
            isActive ? 'text-sky-600 dark:text-sky-400' : '',
          ].join(' ')}
        >
          {label}
        </Typography>
      </ListItem>
    </Link>
  );
}

interface NestedListItemProps extends MenuItem {
  index: number;
  open: number;
  handleOpen: (index: number) => void;
  isActivePath: (path?: string) => boolean;
  onNavigate?: () => void;
}

function NestedListItem({ iconId, label, children, index, open, handleOpen, isActivePath, onNavigate }: NestedListItemProps) {
  const anyChildActive = children?.some(c => isActivePath(c.path));
  return (
    <Accordion
      open={open === index}
      icon={
        <BsChevronDown
          strokeWidth={1}
          className={`mx-auto h-4 w-4 transition-transform ${open === index ? "rotate-180" : ""}`}
        />
      }
    >
      <ListItem
        className={[
          'p-0 transition-colors duration-150',
          anyChildActive ? 'bg-sky-50/60 dark:bg-sky-900/10' : '',
        ].join(' ')}
        selected={open === index}
      >
        <AccordionHeader
          onClick={() => handleOpen(index)}
          className={[
            'border-b-0 p-3',
            anyChildActive
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-gray-800 dark:text-white dark:hover:bg-gray-700/50',
          ].join(' ')}
        >
          <ListItemPrefix className={anyChildActive ? 'text-sky-500' : 'text-gray-500 dark:text-gray-400'}>
            {hasIcon(iconId) && iconIds[iconId]}
          </ListItemPrefix>
          <Typography
            className={[
              'mr-auto font-semibold text-sm',
              anyChildActive ? 'text-sky-600 dark:text-sky-400' : '',
            ].join(' ')}
          >
            {label}
          </Typography>
        </AccordionHeader>
      </ListItem>
      <AccordionBody className="py-1">
        <List className="p-0">
          {children?.map((child, idx) => (
            <SingleListItem
              key={idx}
              iconId={child.iconId}
              label={child.label}
              path={child.path}
              isChild={true}
              isActive={isActivePath(child.path)}
              onNavigate={onNavigate}
            />
          ))}
        </List>
      </AccordionBody>
    </Accordion>
  );
}

export default function SidebarMenu({ title, menuItems, mobile = false, onNavigate }: SidebarMenuProps) {
  const location = useLocation();
  
  const isActivePath = (path?: string) => !!path && location.pathname === path;

  const [open, setOpen] = useState(() => {
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      if (item.children?.some(c => isActivePath(c.path))) {
        return i + 1;
      }
    }
    return 0;
  });

  useEffect(() => {
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      if (item.children?.some(c => isActivePath(c.path))) {
        setOpen(i + 1);
        break;
      }
    }
  }, [location.pathname, menuItems]);

  const handleOpen = (value: number) => {
    setOpen(open === value ? 0 : value);
  };

  return (
    <Card className={`fixed inset-y-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-72 max-w-none overflow-y-auto rounded-none border-y-0 border-l-0 p-4 shadow-xl shadow-blue-gray-900/5 dark:bg-gray-900/95 ${mobile ? 'block' : 'hidden lg:block'}`}>
      <div className="mb-2 p-4">
        <Typography variant="h5" color="blue-gray" className="text-gray-800 dark:text-white">
          {title}
        </Typography>
      </div>
      <hr className="my-1 border-gray-200 dark:border-gray-700" />
      <List>
        {menuItems.map((item, index) => {
          if (item.children) {
            return (
              <NestedListItem
                key={index}
                iconId={item.iconId}
                label={item.label}
                children={item.children}
                index={index + 1}
                open={open}
                handleOpen={handleOpen}
                isActivePath={isActivePath}
                onNavigate={onNavigate}
              />
            );
          } else {
            return (
              <SingleListItem
                key={index}
                iconId={item.iconId}
                label={item.label}
                path={item.path}
                isActive={isActivePath(item.path)}
                onNavigate={onNavigate}
              />
            );
          }
        })}
      </List>
    </Card>
  );
}

