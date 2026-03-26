import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About - CountryCompare | Compare Country Economics',
  description:
    'CountryCompare lets you compare economies of 200+ countries using World Bank Open Data. Built by GlobalData Store.',
  openGraph: {
    title: 'About CountryCompare',
    description: 'Compare economies of 200+ countries with real World Bank data.',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-800 to-blue-600 px-4 pt-16 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
          About CountryCompare
        </h1>
        <p className="mt-3 text-lg text-blue-100 max-w-xl mx-auto">
          The easiest way to compare economies across the world
        </p>
      </div>

      <main className="mx-auto max-w-3xl px-4 -mt-10 pb-16 space-y-8">
        {/* What is CountryCompare */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">What is CountryCompare?</h2>
          <p className="text-gray-600 leading-relaxed">
            CountryCompare is a free tool that lets you compare economic indicators between any two
            countries. From GDP and population to unemployment rates and trade balances, we make
            global economic data accessible and easy to understand through interactive charts and
            tables.
          </p>
          <p className="mt-3 text-gray-600 leading-relaxed">
            With over 1,225 pre-built country comparison pages and 50+ economic indicators,
            CountryCompare is used by students, researchers, journalists, and professionals worldwide.
          </p>
        </section>

        {/* Built by */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Built by GlobalData Store</h2>
          <p className="text-gray-600 leading-relaxed">
            CountryCompare is built and maintained by <strong>GlobalData Store</strong>, a team
            focused on making global data more accessible. We believe that understanding the world
            starts with understanding the numbers behind it.
          </p>
        </section>

        {/* Data Source */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Data Source</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              All data comes from the{' '}
              <a
                href="https://data.worldbank.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                World Bank Open Data
              </a>{' '}
              platform &mdash; one of the most comprehensive sources of global development data.
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span><strong>200+ countries</strong> covered worldwide</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span><strong>10,000+ indicators</strong> available in the World Bank database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span><strong>Free and open</strong> &mdash; World Bank data is publicly available under open license</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">&#8226;</span>
                <span><strong>Daily auto-refresh</strong> &mdash; data is automatically updated every day</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Contact */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Contact</h2>
          <p className="text-gray-600">
            Questions, feedback, or partnership inquiries? Reach us at{' '}
            <a
              href="mailto:193market@gmail.com"
              className="text-blue-600 underline hover:text-blue-800"
            >
              193market@gmail.com
            </a>
          </p>
        </section>

        {/* CTA */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-800 transition"
          >
            Start Comparing Countries
          </Link>
        </div>
      </main>
    </div>
  );
}
