import React, { useEffect } from 'react';

// Friendly labels for each database field
const FIELD_LABELS = {
  itemName: 'Item Name',
  billName: 'Bill Name',
  quantity: 'Quantity',
  price: 'Price',
  amount: 'Bill Amount',
  totalPrice: 'Total Price',
  date: 'Date',
  time: 'Time',
  groupDate: 'Group Date',
  image: 'Bill Image',
};

// Formats numeric values or strings nicely (e.g., 7998.7 -> 7,998.7)
function formatValue(val) {
  if (val === null || val === undefined || val === '') {
    return '-';
  }
  if (typeof val === 'number') {
    // Keep decimal precision without losing tenths/hundredths
    return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  // If string is purely numeric
  if (typeof val === 'string' && !isNaN(Number(val)) && val.trim() !== '') {
    const num = Number(val);
    return num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  }
  return String(val);
}

// Formats timestamp to match Image 2: "10/7/2026, 8:47:27 pm"
function formatChangeTimestamp(input) {
  if (!input) return '';
  try {
    const trimmed = String(input).trim();
    let d;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split(/[\sT]+/);
      const dateParts = parts[0].split('-').map(Number);
      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      if (parts[1]) {
        const timeParts = parts[1].split(':').map(Number);
        hours = timeParts[0] || 0;
        minutes = timeParts[1] || 0;
        seconds = timeParts[2] || 0;
      }
      d = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, seconds);
    } else {
      d = new Date(trimmed);
    }

    if (isNaN(d.getTime())) {
      return trimmed;
    }

    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    let hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  } catch {
    return String(input);
  }
}

// Extracts diff of fields changed between previous and updated snapshots
function getFieldDiffs(prev = {}, curr = {}) {
  const diffs = [];
  const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(curr)]));

  for (const key of allKeys) {
    if (['_id', 'id', 'editHistory', 'editCount', 'updatedDate', 'createdAt', 'updatedAt', '__v'].includes(key)) {
      continue;
    }

    const prevVal = prev[key];
    const currVal = curr[key];

    // Check if numeric equality holds (e.g. 10 === "10")
    const isNumEqual = !isNaN(Number(prevVal)) && !isNaN(Number(currVal)) && prevVal !== '' && currVal !== '' && Number(prevVal) === Number(currVal);
    const isStrEqual = String(prevVal ?? '').trim() === String(currVal ?? '').trim();

    if (!isNumEqual && !isStrEqual && (prevVal !== undefined || currVal !== undefined)) {
      diffs.push({
        key,
        label: FIELD_LABELS[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
        previous: formatValue(prevVal, key),
        updated: formatValue(currVal, key),
      });
    }
  }

  // Sort logically: quantity/amount first, then price/totalPrice, then name, date, etc.
  const priority = ['quantity', 'price', 'totalPrice', 'amount', 'billName', 'itemName', 'date', 'time'];
  diffs.sort((a, b) => {
    const idxA = priority.indexOf(a.key);
    const idxB = priority.indexOf(b.key);
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  return diffs;
}

export default function ChangeHistoryModal({ isOpen, onClose, item }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const rawHistory = Array.isArray(item.editHistory) ? item.editHistory : [];

  // Build change entries list (ordered newest to oldest)
  const changes = rawHistory.map((entry, index) => {
    const prev = entry.previousValues || entry.previousData || {};
    const curr = entry.updatedValues || entry.updatedData || {};
    const diffs = getFieldDiffs(prev, curr);
    return {
      changeNumber: index + 1,
      timestamp: formatChangeTimestamp(entry.timestamp || item.updatedDate),
      diffs,
      note: entry.note,
    };
  }).reverse(); // Reverse so latest change is top (e.g. Change #2, then Change #1)

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        {/* Header matching Image 2 */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white tracking-tight">
              Edit History
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
              Previous values and the updated values for each change
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white font-medium text-sm px-2.5 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Changes List matching Image 2 */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-stone-50/30 dark:bg-stone-950/20">
          {changes.length === 0 ? (
            <div className="text-center py-10 text-stone-400 dark:text-stone-500 text-sm">
              No modifications recorded yet for this item.
            </div>
          ) : (
            changes.map((change) => (
              <div
                key={change.changeNumber}
                className="bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 rounded-2xl p-5 shadow-2xs"
              >
                {/* Change Header */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-stone-900 dark:text-white text-sm sm:text-base">
                    Change #{change.changeNumber}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
                    {change.timestamp}
                  </span>
                </div>

                {/* Subcards for Each Changed Field */}
                {change.diffs.length > 0 ? (
                  <div className="space-y-3">
                    {change.diffs.map((diff, dIdx) => (
                      <div
                        key={dIdx}
                        className="rounded-xl border border-stone-150 dark:border-stone-800 bg-white dark:bg-stone-850/40 p-3.5"
                      >
                        <h4 className="font-semibold text-xs sm:text-sm text-stone-800 dark:text-stone-200 mb-2">
                          {diff.label}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">
                              PREVIOUS
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">
                              {diff.previous}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-0.5">
                              UPDATED
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-300">
                              {diff.updated}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Fallback if no specific field diff was captured (e.g. note or manual edit) */
                  <div className="rounded-xl border border-stone-150 dark:border-stone-800 bg-white dark:bg-stone-850/40 p-3.5">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1">
                      SUMMARY
                    </span>
                    <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                      {change.note || 'Item updated with new values'}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
