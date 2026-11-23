import React from 'react';
import { FiLayers } from 'react-icons/fi';
import { FaIndianRupeeSign } from 'react-icons/fa6';
import { HiSparkles } from 'react-icons/hi2';

export default function TotalBanner({
  title = "Total Amount",
  amount = 0,
  count = 0,
  countLabel = "items",
  badge = null,
  accentColor = "amber", // amber | emerald | rose
}) {
  const formattedAmount = Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const getAccentStyles = () => {
    switch (accentColor) {
      case 'emerald':
        return 'border-emerald-300 dark:border-emerald-800 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent text-emerald-600 dark:text-emerald-400';
      case 'rose':
        return 'border-rose-300 dark:border-rose-800 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent text-rose-600 dark:text-rose-400';
      case 'amber':
      default:
        return 'border-amber-300 dark:border-amber-800 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent text-amber-600 dark:text-amber-400';
    }
  };

  return (
    <div className={`p-4 sm:p-5 rounded-2xl border ${getAccentStyles()} backdrop-blur-md shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
      <div className="flex items-center gap-3.5">
        <div className="p-3 rounded-xl bg-white dark:bg-stone-900 shadow-xs border border-stone-200/60 dark:border-stone-800 flex items-center justify-center">
          <HiSparkles className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              {title}
            </h4>
            {badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white flex items-center tracking-tight mt-0.5">
            <span className="text-lg sm:text-xl text-stone-400 font-medium mr-1 flex items-center">
              <FaIndianRupeeSign className="w-4 h-4" />
            </span>
            {formattedAmount}
          </div>
        </div>
      </div>

      {count !== undefined && (
        <div className="flex items-center gap-2 self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 text-xs font-semibold text-stone-600 dark:text-stone-300 shadow-2xs">
          <FiLayers className="w-3.5 h-3.5 text-stone-400" />
          <span>{count} {countLabel}</span>
        </div>
      )}
    </div>
  );
}
