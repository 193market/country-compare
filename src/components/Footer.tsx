import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          {/* Left */}
          <p>&copy; 2026 GlobalData Store. All rights reserved.</p>

          {/* Center */}
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-700 transition">Home</Link>
            <Link href="/pricing" className="hover:text-gray-700 transition">Pricing</Link>
            <Link href="/about" className="hover:text-gray-700 transition">About</Link>
            <a href="mailto:193market@gmail.com" className="hover:text-gray-700 transition">Contact</a>
          </div>

          {/* Right */}
          <p>Data: <a href="https://data.worldbank.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 transition">World Bank Open Data</a></p>
        </div>
      </div>
    </footer>
  );
}
