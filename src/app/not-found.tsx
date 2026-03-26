import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-blue-700">404</p>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="mt-2 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="px-6 py-2.5 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition text-sm"
          >
            Go back to home
          </Link>
          <Link
            href="/compare/united-states-vs-china"
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition text-sm"
          >
            Try comparing countries
          </Link>
        </div>
      </div>
    </div>
  );
}
