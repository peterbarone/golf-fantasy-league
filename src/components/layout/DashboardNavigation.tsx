'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardNavigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  if (!session?.user) return null;
  
  const isAdmin = session.user.role === 'ADMIN';
  const isOwner = session.user.role === 'OWNER';
  
  const adminLinks = [
    { name: 'Dashboard', href: '/dashboard/admin', current: pathname === '/dashboard/admin' },
    { name: 'Users', href: '/dashboard/admin/users', current: pathname.includes('/dashboard/admin/users') },
    { name: 'Teams', href: '/dashboard/admin/teams', current: pathname.includes('/dashboard/admin/teams') },
    { name: 'Tournaments', href: '/dashboard/admin/tournaments', current: pathname.includes('/dashboard/admin/tournaments') },
    { name: 'Golfers', href: '/dashboard/admin/golfers', current: pathname.includes('/dashboard/admin/golfers') },
    { name: 'Results', href: '/dashboard/admin/results', current: pathname.includes('/dashboard/admin/results') },
    { name: 'Points', href: '/dashboard/admin/points', current: pathname.includes('/dashboard/admin/points') },
    { name: 'Lineups', href: '/dashboard/admin/lineups', current: pathname.includes('/dashboard/admin/lineups') },
    { name: 'Standings', href: '/dashboard/admin/standings', current: pathname.includes('/dashboard/admin/standings') },
    { name: 'Skins', href: '/dashboard/admin/skins', current: pathname.includes('/dashboard/admin/skins') },
  ];
  
  const ownerLinks = [
    { name: 'Dashboard', href: '/dashboard/owner', current: pathname === '/dashboard/owner' },
    { name: 'Submit Lineup', href: '/dashboard/owner?tab=lineup', current: pathname === '/dashboard/owner' && pathname.includes('tab=lineup') },
    { name: 'My Team', href: '/dashboard/owner?tab=roster', current: pathname === '/dashboard/owner' && pathname.includes('tab=roster') },
    { name: 'Standings', href: '/dashboard/owner/standings', current: pathname.includes('/dashboard/owner/standings') },
  ];
  
  const commonLinks = [
    { name: 'My Profile', href: '/dashboard/profile', current: pathname === '/dashboard/profile' },
  ];
  
  const links = isAdmin ? adminLinks : isOwner ? ownerLinks : [];
  
  return (
    <nav className="bg-green-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-white text-lg font-bold">
                Golf Fantasy League
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              {/* Desktop navigation */}
              <div className="flex space-x-4">
                {links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`${
                      link.current
                        ? 'bg-green-900 text-white'
                        : 'text-green-100 hover:bg-green-700 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium`}
                    aria-current={link.current ? 'page' : undefined}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Profile dropdown */}
            <div className="relative ml-3">
              <div className="flex items-center">
                {commonLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`${
                      link.current
                        ? 'bg-green-900 text-white'
                        : 'text-green-100 hover:bg-green-700 hover:text-white'
                    } px-3 py-2 rounded-md text-sm font-medium mr-2`}
                  >
                    {link.name}
                  </Link>
                ))}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-green-100 hover:bg-green-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-green-100 hover:bg-green-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-expanded="false"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              {!mobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`${
                  link.current
                    ? 'bg-green-900 text-white'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                aria-current={link.current ? 'page' : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {commonLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`${
                  link.current
                    ? 'bg-green-900 text-white'
                    : 'text-green-100 hover:bg-green-700 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut({ callbackUrl: '/' });
              }}
              className="text-green-100 hover:bg-green-700 hover:text-white block w-full text-left px-3 py-2 rounded-md text-base font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
