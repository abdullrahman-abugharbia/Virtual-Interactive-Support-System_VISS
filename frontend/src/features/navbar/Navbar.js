import { Fragment, useState, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  ShoppingCartIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectItems } from '../cart/cartSlice';
import { selectUserInfo } from '../user/userSlice';

const navigation = [
  { name: 'Products', link: '/', user: true },
  { name: 'Products', link: '/admin', admin: true },
  { name: 'Orders', link: '/admin/orders', admin: true },
];
const userNavigation = [
  { name: 'My Profile', link: '/profile' },
  { name: 'My Orders', link: '/my-orders' },
  { name: 'Sign out', link: '/logout' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function initialsFor(userInfo) {
  const source = (userInfo?.name || userInfo?.email || 'V').trim();
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] || '') + (parts[1]?.[0] || '');
  return (letters || source[0] || 'V').toUpperCase();
}

function NavBar({ children }) {
  const items = useSelector(selectItems);
  const userInfo = useSelector(selectUserInfo);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Keep the box in sync when the URL search term changes (e.g. Aria searches).
  useEffect(() => {
    setQuery(searchParams.get('q') || '');
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = query.trim();
    navigate(term ? `/?q=${encodeURIComponent(term)}` : '/');
  };

  if (!userInfo) return <>{children}</>;

  const searchBox = (extra = '') => (
    <div className={`relative ${extra}`}>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products…"
        className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-sm text-content outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary-soft"
      />
    </div>
  );

  return (
    <div className="min-h-full bg-background">
      <Disclosure
        as="nav"
        className="sticky top-0 z-40 border-b border-line-subtle bg-background/85 backdrop-blur-[14px]"
      >
        {({ open }) => (
          <>
            <div className="mx-auto max-w-[1440px] px-5 sm:px-10">
              <div className="flex h-[66px] items-center gap-9">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5">
                  <span className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-logo-gradient text-[15px] font-bold text-white">
                    V
                  </span>
                  <span className="text-base font-bold tracking-tight text-content">
                    VISS
                  </span>
                </Link>

                {/* Nav links */}
                <div className="hidden items-center gap-1 md:flex">
                  {navigation.map((item) =>
                    item[userInfo.role] ? (
                      <Link
                        key={item.name + item.link}
                        to={item.link}
                        className={classNames(
                          location.pathname === item.link
                            ? 'bg-primary-soft text-content'
                            : 'text-muted hover:text-content',
                          'rounded-lg px-3.5 py-1.5 text-[13.5px] font-medium transition-colors'
                        )}
                      >
                        {item.name}
                      </Link>
                    ) : null
                  )}
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} className="hidden flex-1 justify-center px-6 md:flex">
                  {searchBox('w-full max-w-md')}
                </form>

                {/* Right cluster */}
                <div className="hidden items-center gap-[18px] md:flex">
                  <Link
                    to="/cart"
                    className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-line bg-surface text-content transition-colors hover:border-primary"
                  >
                    <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                    {items.length > 0 && (
                      <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-primary px-[5px] text-[10.5px] font-bold text-white">
                        {items.length}
                      </span>
                    )}
                  </Link>

                  {/* Profile dropdown — Headless UI logic kept */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                      <span className="sr-only">Open user menu</span>
                      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-line bg-gradient-to-br from-line to-[#475569] text-xs font-semibold text-content">
                        {initialsFor(userInfo)}
                      </span>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right overflow-hidden rounded-card border border-line bg-surface py-1 shadow-card-hover focus:outline-none">
                        {userNavigation.map((item) => (
                          <Menu.Item key={item.name}>
                            {({ active }) => (
                              <Link
                                to={item.link}
                                className={classNames(
                                  active ? 'bg-surface-raised text-content' : 'text-muted',
                                  'block px-4 py-2 text-sm transition-colors'
                                )}
                              >
                                {item.name}
                              </Link>
                            )}
                          </Menu.Item>
                        ))}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>

                {/* Mobile menu button */}
                <div className="flex md:hidden">
                  <Disclosure.Button className="inline-flex items-center justify-center rounded-lg border border-line bg-surface p-2 text-muted hover:text-content focus:outline-none focus:ring-2 focus:ring-primary">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            {/* Mobile panel */}
            <Disclosure.Panel className="border-t border-line-subtle md:hidden">
              <form onSubmit={handleSearch} className="px-4 pt-3">
                {searchBox('w-full')}
              </form>
              <div className="space-y-1 px-4 pb-3 pt-3">
                {navigation.map((item) =>
                  item[userInfo.role] ? (
                    <Disclosure.Button
                      key={item.name + item.link}
                      as={Link}
                      to={item.link}
                      className={classNames(
                        location.pathname === item.link
                          ? 'bg-primary-soft text-content'
                          : 'text-muted hover:text-content',
                        'block rounded-lg px-3 py-2 text-base font-medium'
                      )}
                    >
                      {item.name}
                    </Disclosure.Button>
                  ) : null
                )}
              </div>
              <div className="border-t border-line-subtle pb-3 pt-4">
                <div className="flex items-center gap-3 px-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-gradient-to-br from-line to-[#475569] text-sm font-semibold text-content">
                    {initialsFor(userInfo)}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-base font-medium text-content">
                      {userInfo.name || 'New User'}
                    </div>
                    <div className="truncate text-sm text-muted">{userInfo.email}</div>
                  </div>
                  <Link to="/cart" className="ml-auto">
                    <span className="relative flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-line bg-surface text-content">
                      <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />
                      {items.length > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-primary px-[5px] text-[10.5px] font-bold text-white">
                          {items.length}
                        </span>
                      )}
                    </span>
                  </Link>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  {userNavigation.map((item) => (
                    <Disclosure.Button
                      key={item.name}
                      as={Link}
                      to={item.link}
                      className="block rounded-lg px-3 py-2 text-base font-medium text-muted hover:bg-surface-raised hover:text-content"
                    >
                      {item.name}
                    </Disclosure.Button>
                  ))}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>

      <main>{children}</main>
    </div>
  );
}

export default NavBar;
