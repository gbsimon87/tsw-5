import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import {
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowLeftEndOnRectangleIcon,
  UserPlusIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { getInitials } from '../utils/getInitials';

const navIcons = {
  "My Sporty": <UserCircleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />,
  "Admin Panel": <Cog6ToothIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />,
  "Join a Team": <UserPlusIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />,
  "Upcoming Features": <SparklesIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />,
  "About": <InformationCircleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />,
  "Log out": <ArrowLeftEndOnRectangleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />,
};

function NavBar() {
  const { user, logout } = useAuth();
  const isAuthenticated = user !== null;
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    ...(isAuthenticated
      ? [
        { name: 'My Sporty', to: '/my-sporty', current: false },
        { name: 'Admin Panel', to: '/admin', current: false },
        { name: 'Join a Team', to: '/teams/join', current: false },
      ]
      : [
        { name: 'Login', to: '/login', current: false },
        { name: 'Register', to: '/register', current: false },
      ]),
    { name: 'Upcoming Features', to: '/upcoming-features', current: false },
    { name: 'About', to: '/about', current: false },
  ];

  return (
    <Disclosure as="nav" className="bg-gray-800 z-[100]" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              <Bars3Icon aria-hidden="true" className="block size-6 group-data-[open]:hidden" />
              <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-[open]:block" />
            </DisclosureButton>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <NavLink to="/" className="flex shrink-0 items-center text-2xl font-bold text-white no-underline" aria-label="Home">
              TSW
            </NavLink>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      isActive
                        ? 'bg-gray-900 text-white rounded-md px-3 py-2 text-sm font-medium'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium'
                    }
                    aria-label={`${item.name} page`}
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
          {isAuthenticated && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
              <Menu as="div" className="relative ml-3">
                <MenuButton className="relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800">
                  <span className="absolute -inset-1.5" />
                  <span className="sr-only">Open user menu</span>
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt="User profile"
                      className="size-8 rounded-full"
                    />
                  ) : (
                    <div
                      className="size-8 rounded-full bg-gray-600 text-white text-sm font-semibold flex items-center justify-center uppercase"
                      aria-label={`User profile: ${user.name || user.email}`}
                    >
                      {getInitials(user)}
                    </div>
                  )}
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                >
                  <MenuItem>
                    <NavLink
                      to="/my-sporty"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      aria-label="My Sporty"
                    >
                      <UserCircleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      My Sporty
                    </NavLink>
                  </MenuItem>
                  <MenuItem>
                    <NavLink
                      to="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      aria-label="Admin Panel"
                    >
                      <Cog6ToothIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      Admin Panel
                    </NavLink>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      onClick={handleLogoutClick}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                      aria-label="Log out"
                    >
                      <ArrowLeftEndOnRectangleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      Log out
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <span className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 bg-gray-100">
                      <UserCircleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      {user.name || user.email}
                    </span>
                  </MenuItem>
                </MenuItems>

              </Menu>
            </div>
          )}
        </div>
      </div>
      <DisclosurePanel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {navigation.map((item) => (
            <DisclosureButton
              key={item.name}
              as={NavLink}
              to={item.to}
              className={({ isActive }) =>
                (isActive
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                ) +
                ' flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium'
              }
              aria-label={`${item.name} page`}
            >
              {navIcons[item.name] && (
                <span aria-hidden="true">{navIcons[item.name]}</span>
              )}
              {item.name}
            </DisclosureButton>
          ))}
          {/* If you want to add a logout button in the mobile menu, add it here: */}
          <DisclosureButton
            as="button"
            onClick={handleLogoutClick}
            className="flex items-center gap-3 w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white rounded-md px-3 py-2 text-base font-medium"
            aria-label="Log out"
          >
            <ArrowLeftEndOnRectangleIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
            Log out
          </DisclosureButton>
        </div>
      </DisclosurePanel>

    </Disclosure>
  );
}

export default NavBar;