import React from 'react';
import { FiPlus, FiDownload, FiSearch, FiEdit2, FiTrash2, FiBookOpen } from 'react-icons/fi';
import { exportToPDF } from '../utils/exportUtils';
import EditStatusBadge from './common/EditStatusBadge';

// Category color pills
const CATEGORY_STYLES = {
  General: 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700',
  Kitchen: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  Staff: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  Inventory: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  Maintenance: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  Important: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
};

export default function NoteDateCard({
  date,
  notes = [],
  onAddForDate,
  onEdit,
  onDelete,
  onImageClick,
  onHistoryClick,
  cartIdPrefix = 'note-cart',
}) {
  const containerId = `${cartIdPrefix}-${date}`;
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = date === todayStr;

  // Export Date notes as PDF
  const handleDatePDF = () => {
    const headers = ['#', 'Category', 'Title', 'Note Content', 'Date', 'Time', 'Updated Date'];
    const rows = notes.map((n, idx) => [
      idx + 1,
      n.category || 'General',
      n.title || 'Note',
      n.content || '',
      n.date || date,
      n.time || '-',
      n.updatedDate || '-',
    ]);

    exportToPDF({
      title: `Notes for ${date}`,
      subtitle: `Date Group Notes: ${date}`,
      headers,
      rows,
      totals: ['Total Notes', `${notes.length} note(s)`, '', '', '', '', ''],
      fileName: `maaza-notes-${date}.pdf`,
    });
  };

  return (
    <div
      id={containerId}
      className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs overflow-hidden transition-all mb-6 card-hover"
    >
      {/* Date Header matching the system's DateCart header */}
      <div className="px-5 py-3.5 bg-white dark:bg-stone-900 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <FiBookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-extrabold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
            {date} {isToday ? '(Today)' : ''}
          </h3>
          <span className="text-xs text-stone-400 dark:text-stone-500 font-medium">
            ({notes.length} {notes.length === 1 ? 'note' : 'notes'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Green + Add Button for this date */}
          {onAddForDate && (
            <button
              onClick={() => onAddForDate(date)}
              type="button"
              className="btn-cart-add active:scale-95 shadow-2xs gap-1 py-1.5 px-3 cursor-pointer"
              title={`Add note to date ${date}`}
            >
              <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Add</span>
            </button>
          )}

          {/* Blue Download PDF Button */}
          <button
            onClick={handleDatePDF}
            type="button"
            className="btn-cart-pdf active:scale-95 shadow-2xs p-1.5 cursor-pointer"
            title="Download notes for this date as PDF"
          >
            <FiDownload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes Table */}
      <div className="overflow-x-auto">
        <table className="teal-header-table">
          <thead>
            <tr>
              <th className="w-28">Category</th>
              <th className="w-48">Title</th>
              <th>Note Content</th>
              <th className="w-28">Date</th>
              <th className="w-24">Time</th>
              <th className="w-44">Updated Date</th>
              {onImageClick && <th className="w-16 text-center">Attach</th>}
              <th className="text-center min-w-[170px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {notes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-stone-400 text-xs">
                  No notes recorded for this date.
                </td>
              </tr>
            ) : (
              notes.map((note) => {
                const categoryClass = CATEGORY_STYLES[note.category] || CATEGORY_STYLES.General;
                return (
                  <tr key={note._id || note.id} className="hover:bg-stone-50/60 dark:hover:bg-stone-850/50 transition-colors">
                    {/* Category Pill */}
                    <td>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${categoryClass}`}>
                        {note.category || 'General'}
                      </span>
                    </td>

                    {/* Title */}
                    <td>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {note.title}
                      </span>
                    </td>

                    {/* Content */}
                    <td className="max-w-md">
                      <p className="text-xs text-stone-700 dark:text-stone-300 whitespace-pre-wrap line-clamp-3">
                        {note.content}
                      </p>
                    </td>

                    {/* Date */}
                    <td className="text-stone-600 dark:text-stone-400 text-xs">
                      {note.date || date}
                    </td>

                    {/* Time */}
                    <td className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                      {note.time || '-'}
                    </td>

                    {/* Updated Date */}
                    <td className="text-xs font-mono text-stone-600 dark:text-stone-300">
                      {note.updatedDate || '-'}
                    </td>

                    {/* Attachment Image */}
                    {onImageClick && (
                      <td className="text-center">
                        <div className="flex justify-center">
                          {note.image ? (
                            <button
                              onClick={() => onImageClick(note.image, note.title)}
                              type="button"
                              className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-amber-600 hover:scale-105 transition-all shadow-2xs cursor-pointer"
                              title="Click to view attached image"
                            >
                              <FiSearch className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-stone-100/60 dark:bg-stone-800/40 border border-stone-200/80 dark:border-stone-700/80 flex items-center justify-center text-stone-300 dark:text-stone-600">
                              <FiSearch className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Actions */}
                    <td className="text-center">
                      <div className="flex flex-col items-center justify-center gap-1 py-0.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(note)}
                              type="button"
                              className="btn-action-edit cursor-pointer"
                              title="Edit note"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(note._id || note.id, note.title)}
                              type="button"
                              className="btn-action-delete cursor-pointer"
                              title="Delete note"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <EditStatusBadge
                          editCount={note.editCount || (Array.isArray(note.editHistory) ? note.editHistory.length : 0)}
                          lastEdited={
                            (Array.isArray(note.editHistory) && note.editHistory.length > 0 && note.editHistory[note.editHistory.length - 1]?.timestamp) ||
                            note.updatedDate
                          }
                          onClick={() => onHistoryClick && onHistoryClick(note)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
