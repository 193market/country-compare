'use client';

import { useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ProModal({ open, onClose }: Props) {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleVerify = async () => {
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.reload();
      } else {
        setError(data.error || 'Invalid license key');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl cursor-pointer"
        >
          &times;
        </button>

        <div className="text-center mb-6">
          <div className="text-4xl mb-3">&#128273;</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Unlock Pro</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Access all 50 indicators with 25 years of data
          </p>
        </div>

        {!showKeyInput ? (
          <div className="space-y-3">
            <a
              href={process.env.NEXT_PUBLIC_GUMROAD_PRODUCT_URL || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:from-amber-600 hover:to-orange-600 transition text-sm"
            >
              Buy Pro &mdash; $9/month
            </a>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Secure checkout via Gumroad &middot; Cancel anytime
            </p>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-gray-800 px-3 text-xs text-gray-400">or</span>
              </div>
            </div>

            <button
              onClick={() => setShowKeyInput(true)}
              className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm cursor-pointer"
            >
              I already have a license key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                License Key
              </label>
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => { setLicenseKey(e.target.value); setError(''); }}
                placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                <span>&#9888;</span>
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-700 text-white font-semibold rounded-xl hover:bg-blue-800 disabled:opacity-50 transition text-sm cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying...
                </span>
              ) : (
                'Activate License'
              )}
            </button>

            <button
              onClick={() => { setShowKeyInput(false); setError(''); }}
              className="w-full text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer"
            >
              &larr; Back
            </button>
          </div>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">PRO INCLUDES:</p>
          <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 50 economic indicators (vs 5 free)</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> 25-year historical data (2000&ndash;2024)</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> Economy, Labor, Society, Energy, Trade</li>
            <li className="flex items-center gap-2"><span className="text-green-500">&#10003;</span> No ads</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
