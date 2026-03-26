'use client';

import { useState, useRef, useEffect } from 'react';
import { countryCodeToFlag } from '@/lib/flags';

interface CountryOption {
  id: string;
  name: string;
}

interface Props {
  label: string;
  value: string;
  countries: CountryOption[];
  loading: boolean;
  onChange: (code: string) => void;
}

export default function CountrySearch({ label, value, countries, loading, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = countries.find((c) => c.id === value);
  const filtered = query
    ? countries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : countries;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
      <button
        type="button"
        onClick={() => { setOpen(!open); setQuery(''); setTimeout(() => inputRef.current?.focus(), 0); }}
        disabled={loading}
        className="w-full flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none transition text-left cursor-pointer disabled:opacity-50"
      >
        {loading ? (
          <span className="text-gray-400">Loading...</span>
        ) : selected ? (
          <>
            <span className="text-lg leading-none">{countryCodeToFlag(selected.id)}</span>
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-gray-400">Select country</span>
        )}
        <svg className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-400">No countries found</li>
            ) : (
              filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => { onChange(c.id); setOpen(false); setQuery(''); }}
                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer ${
                      c.id === value ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-base leading-none">{countryCodeToFlag(c.id)}</span>
                    {c.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
