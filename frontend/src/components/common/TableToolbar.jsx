import React from 'react';
import { FiSearch, FiCalendar, FiFileText, FiRotateCcw, FiTrash2, FiPlus } from 'react-icons/fi';
import { MdCalendarMonth } from 'react-icons/md';

export default function TableToolbar({
  search = '',
  onSearchChange,
  date = '',
  onDateChange,
  month = '',
  onMonthChange,
  showOnlyToday = true,
  onToggleOnlyToday,
  onExportPDF,
  onExportMonthlyPDF,
  onDeleteMonth,
  onAddForDate,
  onReset,
  placeholder = 'Search by item name or month (e.g. August)...',
}) {
  // Format YYYY-MM to readable month string (e.g. "August 2026")
  const formatMonthDisplay = (mStr) => {
    if (!mStr) return '';
    try {
      const [year, mNum] = mStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(mNum, 10) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return mStr;
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-3 mb-6">
      {/* Search Input Row, Date Picker & Month Picker */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <FiSearch className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="form-input-box pl-9 text-xs"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Date Filter (Search by particular date) */}
        <div className="relative flex items-center min-w-[155px]">
          <input
            id="toolbar-date-picker"
            type="date"
            value={date}
            onChange={(e) => {
              onDateChange(e.target.value);
              if (e.target.value && onMonthChange) onMonthChange('');
            }}
            className="form-input-box text-xs pr-8 cursor-pointer"
            title="Search by particular date"
          />
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('toolbar-date-picker');
              if (el && typeof el.showPicker === 'function') {
                try { el.showPicker(); } catch { el.focus(); }
              } else if (el) {
                el.focus();
              }
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer p-0.5"
            title="Click calendar icon to pick specific date"
          >
            <FiCalendar className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        {/* Month Filter (Search by Month e.g. August 2026) */}
        {onMonthChange && (
          <div className="relative flex items-center min-w-[155px]">
            <input
              id="toolbar-month-picker"
              type="month"
              value={month}
              onChange={(e) => {
                onMonthChange(e.target.value);
                if (e.target.value && onDateChange) onDateChange('');
              }}
              className="form-input-box text-xs pr-8 cursor-pointer"
              title="Search and filter by month (e.g. August 2026)"
            />
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('toolbar-month-picker');
                if (el && typeof el.showPicker === 'function') {
                  try { el.showPicker(); } catch { el.focus(); }
                } else if (el) {
                  el.focus();
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer p-0.5"
              title="Click to pick month"
            >
              <MdCalendarMonth className="w-4 h-4 pointer-events-none text-sky-600 dark:text-sky-400" />
            </button>
          </div>
        )}

        {/* Toggle Today vs All Previous Dates */}
        {onToggleOnlyToday && (
          <button
            type="button"
            onClick={onToggleOnlyToday}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
              showOnlyToday
                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
            title="Toggle between today's cart and all previous dates"
          >
            <MdCalendarMonth className="w-3.5 h-3.5 text-amber-500" />
            <span>{showOnlyToday ? "Today's Cart Only" : "All Previous Dates"}</span>
          </button>
        )}
      </div>

      {/* Buttons Row: Orange PDF, Monthly Download PDF, Delete Month, Active Filters, & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Orange PDF button */}
          {onExportPDF && (
            <button
              type="button"
              onClick={onExportPDF}
              className="btn-export-pdf active:scale-95 shadow-xs cursor-pointer"
              title="Download current filtered records as PDF"
            >
              <FiFileText className="w-4 h-4" />
              <span>PDF</span>
            </button>
          )}

          {/* Monthly Download PDF button */}
          {onExportMonthlyPDF && (
            <button
              type="button"
              onClick={onExportMonthlyPDF}
              className="btn-monthly-pdf active:scale-95 shadow-2xs cursor-pointer"
              title={month ? `Download full ${formatMonthDisplay(month)} statement as PDF` : "Download monthly statement as PDF"}
            >
              <FiFileText className="w-3.5 h-3.5 text-sky-200" />
              <span>Monthly Download PDF</span>
            </button>
          )}

          {/* Monthly Wise Delete button */}
          {onDeleteMonth && (
            <button
              type="button"
              onClick={() => onDeleteMonth(month)}
              className="btn-delete-month active:scale-95 shadow-2xs cursor-pointer"
              title={
                month
                  ? `Permanently delete all records for ${formatMonthDisplay(month)}`
                  : 'Open monthly wise delete tool'
              }
            >
              <FiTrash2 className="w-3.5 h-3.5 text-rose-200" />
              <span>
                {month ? `Delete ${formatMonthDisplay(month)} Data` : 'Monthly Wise Delete'}
              </span>
            </button>
          )}

          {/* Active date filter chip & Quick Add to Date button */}
          {date && (
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/90 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                <FiCalendar className="w-3 h-3 text-amber-600" />
                <span>Date: {date}</span>
                <button
                  type="button"
                  onClick={() => onDateChange('')}
                  className="hover:text-rose-600 text-stone-500 dark:text-stone-400 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                  title="Clear date filter"
                >
                  ×
                </button>
              </span>

              {onAddForDate && (
                <button
                  type="button"
                  onClick={() => onAddForDate(date)}
                  className="btn-cart-add active:scale-95 shadow-2xs gap-1 py-1 px-2.5 text-xs font-bold cursor-pointer"
                  title={`Add record directly for ${date}`}
                >
                  <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>+ Add to {date}</span>
                </button>
              )}
            </div>
          )}

          {/* Active month filter chip */}
          {month && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-100/90 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 text-xs font-bold border border-sky-300 dark:border-sky-800">
              <MdCalendarMonth className="w-3 h-3 text-sky-600" />
              <span>Month: {formatMonthDisplay(month)}</span>
              <button
                type="button"
                onClick={() => onMonthChange('')}
                className="hover:text-rose-600 text-stone-500 dark:text-stone-400 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                title="Clear month filter"
              >
                ×
              </button>
            </span>
          )}

          {/* Active search filter chip */}
          {search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-medium border border-stone-200 dark:border-stone-700">
              <FiSearch className="w-3 h-3 text-stone-400" />
              <span>"{search}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-rose-600 text-stone-500 font-bold ml-0.5 text-sm leading-none cursor-pointer"
                title="Clear search"
              >
                ×
              </button>
            </span>
          )}
        </div>

        {/* Reset All Filters Button */}
        {(search || date || month || !showOnlyToday) && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Reset all search, date & month filters"
          >
            <FiRotateCcw className="w-3.5 h-3.5 text-stone-400" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
