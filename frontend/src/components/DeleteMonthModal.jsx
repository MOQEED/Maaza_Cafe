import React, { useState } from 'react';
import { FiTrash2, FiX } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';

// Format YYYY-MM to readable month string (e.g. "August 2026")
function formatMonthName(mStr) {
  if (!mStr) return '';
  try {
    const [year, mNum] = mStr.split('-');
    const d = new Date(parseInt(year, 10), parseInt(mNum, 10) - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return mStr;
  }
}

export default function DeleteMonthModal({
  isOpen,
  onClose,
  onConfirm,
  initialMonth = '',
  items = [],
  pageTitle = 'records',
  loading = false,
}) {
  // Extract distinct months from available items
  const availableMonths = React.useMemo(() => {
    const monthsSet = new Set();
    items.forEach((item) => {
      const d = item.groupDate || item.date;
      if (d && typeof d === 'string' && d.length >= 7) {
        monthsSet.add(d.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [items]);

  const defaultMonth = initialMonth || (availableMonths.length > 0 ? availableMonths[0] : new Date().toISOString().substring(0, 7));
  const [userSelectedMonth, setUserSelectedMonth] = useState('');

  if (!isOpen) return null;

  const selectedMonth = userSelectedMonth || defaultMonth;

  // Calculate stats for the selected month
  const matchingItems = items.filter((item) => {
    const d = item.groupDate || item.date;
    return d && d.startsWith(selectedMonth);
  });

  const count = matchingItems.length;
  const totalAmount = matchingItems.reduce((sum, it) => {
    const val = Number(it.totalPrice ?? it.amount ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const monthLabel = formatMonthName(selectedMonth);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMonth) return;
    onConfirm(selectedMonth);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <FiTrash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-base sm:text-lg">
                Monthly Wise Delete
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Permanently delete records for a specific month
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Month Selection Input */}
          <div>
            <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1.5">
              Select Month to Delete:
            </label>
            <div className="flex gap-2">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setUserSelectedMonth(e.target.value)}
                className="form-input-box text-sm cursor-pointer flex-1"
                required
              />
            </div>
          </div>

          {/* Quick Select Buttons from Existing Months with Data */}
          {availableMonths.length > 0 && (
            <div>
              <span className="block text-[11px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-1.5">
                Months with records in {pageTitle}:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {availableMonths.map((m) => {
                  const mCount = items.filter((it) => (it.groupDate || it.date || '').startsWith(m)).length;
                  const isSelected = selectedMonth === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setUserSelectedMonth(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-50 border-rose-400 text-rose-800 dark:bg-rose-950/60 dark:border-rose-700 dark:text-rose-300 font-bold'
                          : 'bg-stone-50 hover:bg-stone-100 border-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 dark:border-stone-700 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {formatMonthName(m)} ({mCount})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Impact Preview Box */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-900 dark:text-rose-300">
                Selected Month:
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-400">
                {monthLabel || selectedMonth}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-rose-900 dark:text-rose-300">
                Records to delete:
              </span>
              <span className="font-bold text-rose-700 dark:text-rose-400">
                {count} {count === 1 ? 'record' : 'records'}
              </span>
            </div>
            {totalAmount > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-rose-200/50 dark:border-rose-900/40">
                <span className="font-semibold text-rose-900 dark:text-rose-300">
                  Total Value:
                </span>
                <span className="font-black text-rose-700 dark:text-rose-400">
                  ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal">
            ⚠️ <strong>Warning:</strong> This will permanently delete all {count} {pageTitle} record(s) for <strong className="text-stone-800 dark:text-stone-200">{monthLabel}</strong>. This action cannot be reversed.
          </p>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-white text-xs py-2 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || count === 0}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <ClipLoader size={14} color="#ffffff" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>Delete All {monthLabel} Data</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
