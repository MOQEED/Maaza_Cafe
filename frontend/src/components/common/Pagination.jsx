import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
}) {
  if (totalPages <= 1 && totalItems <= itemsPerPage) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white/60 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 rounded-2xl text-xs text-stone-600 dark:text-stone-300 mt-4">
      <div className="flex items-center gap-2">
        <span>Showing page <strong className="text-stone-900 dark:text-white">{currentPage}</strong> of <strong className="text-stone-900 dark:text-white">{totalPages || 1}</strong></span>
        {totalItems > 0 && <span>({totalItems} total items)</span>}
      </div>

      <div className="flex items-center gap-2">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 mr-2">
            <span>Per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Previous Page"
        >
          <FiChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-2 font-bold text-amber-600 dark:text-amber-400">
          {currentPage}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          title="Next Page"
        >
          <FiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
