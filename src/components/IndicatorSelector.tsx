'use client';

import { CATEGORIES, getIndicatorsByCategory, type Indicator, type IndicatorCategory } from '@/lib/indicators';

interface Props {
  selected: Set<string>;
  onToggle: (id: string) => void;
  isPro?: boolean;
  onProClick?: () => void;
}

const CATEGORY_ICONS: Record<IndicatorCategory, string> = {
  Overview: '\u{1F4CA}',
  Economy: '\u{1F4B0}',
  Labor: '\u{1F477}',
  Society: '\u{1F465}',
  Energy: '\u{26A1}',
  Trade: '\u{1F30D}',
};

export default function IndicatorSelector({ selected, onToggle, isPro, onProClick }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">Indicators</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Free
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pro {isPro && '\u2713'}
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const indicators = getIndicatorsByCategory(cat);
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {CATEGORY_ICONS[cat]} {cat}
                {cat !== 'Overview' && !isPro && (
                  <span className="ml-1.5 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">PRO</span>
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {indicators.map((ind: Indicator) => {
                  const canToggle = ind.tier === 'free' || isPro;
                  const isChecked = selected.has(ind.id);
                  return (
                    <button
                      key={ind.id}
                      onClick={() => canToggle ? onToggle(ind.id) : onProClick?.()}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-left text-xs transition
                        ${canToggle
                          ? isChecked
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                          : 'text-gray-400 cursor-pointer hover:bg-amber-50 border border-transparent'
                        }`}
                    >
                      {canToggle ? (
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[10px] flex-shrink-0 ${
                          isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                        }`}>
                          {isChecked && '\u2713'}
                        </span>
                      ) : (
                        <span className="text-[11px] flex-shrink-0">{'\u{1F512}'}</span>
                      )}
                      <span className="truncate">{ind.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100 text-center">
        {isPro ? (
          <p className="text-xs text-green-600 font-medium">
            &#10003; Pro active &middot; Full 25-year data (2000-2024)
          </p>
        ) : (
          <p className="text-xs text-gray-500">
            Free: Recent 10 years (2014-2024) &middot; <span className="text-amber-600 font-medium">Pro: Full 25-year data</span>
          </p>
        )}
      </div>
    </div>
  );
}
