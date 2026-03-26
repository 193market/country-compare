'use client';

import { useState } from 'react';
import ProModal from '@/components/ProModal';

const faqs = [
  {
    q: 'What indicators are included?',
    a: 'Pro includes 50 indicators across 6 categories: Overview (GDP, Population, Unemployment, Inflation, Life Expectancy), Economy (GDP per capita, GDP growth, GNI, and more), Labor (labor force participation, employment ratios), Society (education, poverty, internet usage), Energy (energy use, CO2 emissions, renewables), and Trade (exports, imports, FDI, trade balance).',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription anytime through Gumroad. Your Pro access will remain active until the end of your billing period.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept credit cards and PayPal through our payment partner Gumroad. All transactions are secure and encrypted.',
  },
  {
    q: 'How do I access Pro after payment?',
    a: 'After purchasing, you will receive a license key via email from Gumroad. Enter this key on CountryCompare to instantly unlock all Pro features.',
  },
];

export default function PricingPage() {
  const [showProModal, setShowProModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-b from-blue-800 to-blue-600 px-4 pt-16 pb-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Pricing</h1>
        <p className="mt-3 text-lg text-blue-100">
          Simple pricing. Powerful data.
        </p>
      </div>

      <main className="mx-auto max-w-4xl px-4 -mt-10 pb-16">
        {/* Plan Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900">Free</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              $0<span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="mt-3 text-sm text-gray-500">Get started with essential indicators</p>

            <ul className="mt-6 space-y-3 text-sm text-gray-600 flex-1">
              {[
                '5 economic indicators',
                '10 years of data (2014\u20132024)',
                '2-country comparison',
                'Interactive charts & tables',
                'Contains ads',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <span className="block w-full text-center px-6 py-3 border border-gray-300 text-gray-500 font-semibold rounded-lg text-sm">
                Current Plan
              </span>
            </div>
          </div>

          {/* Pro */}
          <div className="bg-white rounded-xl shadow-md border-2 border-amber-400 p-6 sm:p-8 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full">
              RECOMMENDED
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Pro</h2>
            <p className="mt-1 text-3xl font-bold text-gray-900">
              $9<span className="text-base font-normal text-gray-500">/month</span>
            </p>
            <p className="mt-3 text-sm text-gray-500">Full access to all indicators and data</p>

            <ul className="mt-6 space-y-3 text-sm text-gray-600 flex-1">
              {[
                '50 economic indicators',
                '25 years of data (2000\u20132024)',
                'Compare up to 10 countries',
                'No ads',
                'Chart download (PNG/CSV)',
                'Economy, Labor, Society, Energy, Trade',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <button
                onClick={() => setShowProModal(true)}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-lg shadow-lg hover:from-amber-600 hover:to-orange-600 transition text-sm cursor-pointer"
              >
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer"
                >
                  <span className="text-sm font-medium text-gray-900">{faq.q}</span>
                  <span className="text-gray-400 ml-4 flex-shrink-0">
                    {openFaq === i ? '\u2212' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      <ProModal open={showProModal} onClose={() => setShowProModal(false)} />
    </div>
  );
}
