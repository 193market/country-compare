import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; 2026 GlobalData Store. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-700 dark:hover:text-gray-200 transition">Home</Link>
            <Link href="/pricing" className="hover:text-gray-700 dark:hover:text-gray-200 transition">Pricing</Link>
            <Link href="/about" className="hover:text-gray-700 dark:hover:text-gray-200 transition">About</Link>
            <a href="mailto:193market@gmail.com" className="hover:text-gray-700 dark:hover:text-gray-200 transition">Contact</a>
          </div>
          <p>Data: <a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-200 transition">World Bank Open Data</a></p>
        </div>
      </div>
    </footer>
  );
}
