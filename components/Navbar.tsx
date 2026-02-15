'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Navbar({ traderName }: { traderName: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!traderName) return null;

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/trades', label: 'Trades' },
    { href: '/trades/new', label: 'New Trade' },
    { href: '/settings', label: 'Settings' },
  ];

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-1">
            <Link href="/dashboard" className="text-blue-400 font-bold text-lg mr-6">
              TradingLog
            </Link>
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-400">
              Logged in as <span className="text-white font-medium">{traderName}</span>
            </span>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
