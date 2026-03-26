'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [isPro, setIsPro] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((data) => setIsPro(data.pro === true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/#countries', label: 'Countries' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 transition-colors">
      <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-800 dark:text-blue-400 tracking-tight">CountryCompare</span>
          {isPro && (
            <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full">
              PRO
            </span>
          )}
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
                pathname === link.href || (link.href === '/#countries' && pathname === '/')
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                pathname === link.href || (link.href === '/#countries' && pathname === '/')
                  ? 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
