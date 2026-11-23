import React from 'react';
import { FiPlus, FiDownload, FiSearch, FiEdit2, FiTrash2, FiPrinter } from 'react-icons/fi';
import { exportToPDF } from '../utils/exportUtils';
import EditStatusBadge from './common/EditStatusBadge';

export default function DateCart({
  date,
  items = [],
  total = 0,
  onAddForDate,
  onEdit,
  onDelete,
  onImageClick,
  onHistoryClick,
  onReceiptClick,
  isBill = false,
  cartIdPrefix = 'date-cart',
}) {
  const containerId = `${cartIdPrefix}-${date}`;
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = date === todayStr;

  // Date-wise PDF Export
  const handleDatePDF = () => {
    const headers = isBill
      ? ['#', 'Bill Description', 'Amount', 'Date', 'Time', 'Updated Date']
      : ['#', 'Item Name', 'Qty', 'Price', 'Total Price', 'Date', 'Time', 'Updated Date'];

    const rows = items.map((it, idx) => {
      if (isBill) {
        return [
          idx + 1,
          it.billName || 'Bill',
          `Rs. ${Number(it.amount || 0).toLocaleString('en-IN')}`,
          it.date,
          it.time || '',
          it.updatedDate || '-',
        ];
      }
      return [
        idx + 1,
        it.itemName || 'Item',
        it.quantity || 1,
        `Rs. ${it.price || 0}`,
        `Rs. ${Number(it.totalPrice || 0).toLocaleString('en-IN')}`,
        it.date,
        it.time || '',
        it.updatedDate || '-',
      ];
    });

    const totals = isBill
      ? ['Total', '', `Rs. ${total.toLocaleString('en-IN')}`, '', '', '']
      : ['Total', '', '', '', `Rs. ${total.toLocaleString('en-IN')}`, '', '', ''];

    exportToPDF({
      title: `Records for ${date}`,
      subtitle: `Date Group Statement: ${date}`,
      headers,
      rows,
      totals,
      fileName: `maaza-${date}-report.pdf`,
    });
  };

  return (
    <div
      id={containerId}
      className="rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xs overflow-hidden transition-all mb-6 card-hover"
    >
      {/* Date Header */}
      <div className="px-5 py-3.5 bg-white dark:bg-stone-900 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <h3 className="font-extrabold text-sm sm:text-base text-emerald-700 dark:text-emerald-400">
            {date} {isToday ? '(Today)' : ''}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Green + Add Button */}
          {onAddForDate && (
            <button
              onClick={() => onAddForDate(date)}
              type="button"
              className="btn-cart-add active:scale-95 shadow-2xs gap-1 py-1.5 px-3 cursor-pointer"
              title={`Add item to cart for ${date}`}
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
            title="Download this date as PDF"
          >
            <FiDownload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table matching Image 2 */}
      <div className="overflow-x-auto">
        <table className={isBill ? "purple-header-table" : "orange-header-table"}>
          <thead>
            {isBill ? (
              <tr>
                <th>Bill Name</th>
                <th>Bill Amount</th>
                <th>Date</th>
                <th>Time</th>
                <th>Updated Date</th>
                <th className="text-center w-24">Bill Image</th>
                <th className="text-center min-w-[170px]">Actions</th>
              </tr>
            ) : (
              <tr>
                <th className="w-16 text-center">Image</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Date</th>
                <th>Time</th>
                <th>Updated Date</th>
                <th>Total Price</th>
                <th className="text-center min-w-[170px]">Actions</th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={isBill ? 7 : 9} className="text-center py-8 text-stone-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <p className="text-stone-600 dark:text-stone-300 font-semibold">
                      No records found in the cart for <span className="text-emerald-700 dark:text-emerald-400 font-bold">{date}</span>.
                    </p>
                    {onAddForDate && (
                      <button
                        type="button"
                        onClick={() => onAddForDate(date)}
                        className="btn-cart-add text-xs px-3.5 py-1.5 active:scale-95 shadow-xs font-bold gap-1.5 cursor-pointer"
                      >
                        <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>+ Add Record to {date} Cart</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((it) => {
                const itemTotal = isBill ? (it.amount || 0) : (it.totalPrice || 0);
                const title = it.itemName || it.billName || 'Item';

                if (isBill) {
                  return (
                    <tr key={it._id || it.id}>
                      {/* Bill Name */}
                      <td>
                        <span className="font-bold text-stone-900 dark:text-white">
                          {title}
                        </span>
                      </td>

                      {/* Bill Amount */}
                      <td>
                        <span className="font-extrabold text-orange-600 dark:text-orange-400">
                          ₹{Number(itemTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="text-stone-600 dark:text-stone-400">
                        {it.date}
                      </td>

                      {/* Time */}
                      <td className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                        {it.time || '-'}
                      </td>

                      {/* Updated Date */}
                      <td className="text-xs font-mono text-stone-600 dark:text-stone-300">
                        {it.updatedDate || '-'}
                      </td>

                      {/* Bill Image */}
                      <td className="text-center">
                        <div className="flex justify-center">
                          {it.image ? (
                            <button
                              onClick={() => onImageClick && onImageClick(it.image, title)}
                              type="button"
                              className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-amber-600 hover:scale-105 transition-all shadow-2xs cursor-pointer"
                              title="Click to view image"
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

                      {/* Actions */}
                      <td className="text-center">
                        <div className="flex flex-col items-center justify-center gap-1 py-0.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(it)}
                                type="button"
                                className="btn-action-edit cursor-pointer"
                                title="Edit record"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(it._id || it.id, title)}
                                type="button"
                                className="btn-action-delete cursor-pointer"
                                title="Delete record"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {onReceiptClick && (
                              <button
                                onClick={() => onReceiptClick(it)}
                                type="button"
                                className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors shadow-2xs cursor-pointer"
                                title="Print Thermal Receipt"
                              >
                                <FiPrinter className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <EditStatusBadge
                            editCount={it.editCount || (Array.isArray(it.editHistory) ? it.editHistory.length : 0)}
                            lastEdited={
                              (Array.isArray(it.editHistory) && it.editHistory.length > 0 && it.editHistory[it.editHistory.length - 1]?.timestamp) ||
                              it.updatedDate
                            }
                            onClick={() => onHistoryClick && onHistoryClick(it)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                }

                // Daily Items & Spending
                return (
                  <tr key={it._id || it.id}>
                    {/* Image */}
                    <td className="text-center">
                      <div className="flex justify-center">
                        {it.image ? (
                          <button
                            onClick={() => onImageClick && onImageClick(it.image, title)}
                            type="button"
                            className="w-7 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-500 hover:text-amber-600 hover:scale-105 transition-all shadow-2xs cursor-pointer"
                            title="Click to view image"
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

                    {/* Name */}
                    <td>
                      <span className="font-bold text-stone-900 dark:text-white">
                        {title}
                      </span>
                    </td>

                    {/* Qty */}
                    <td className="text-stone-700 dark:text-stone-300 font-medium">
                      {it.quantity}
                    </td>

                    {/* Price */}
                    <td className="text-stone-600 dark:text-stone-400">
                      ₹{Number(it.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Date */}
                    <td className="text-stone-600 dark:text-stone-400">
                      {it.date}
                    </td>

                    {/* Time */}
                    <td className="text-stone-500 dark:text-stone-400 font-mono text-xs">
                      {it.time || '-'}
                    </td>

                    {/* Updated Date */}
                    <td className="text-xs font-mono text-stone-600 dark:text-stone-300">
                      {it.updatedDate || '-'}
                    </td>

                    {/* Total Price */}
                    <td>
                      <span className="font-extrabold text-orange-600 dark:text-orange-400">
                        ₹{Number(itemTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-center">
                      <div className="flex flex-col items-center justify-center gap-1 py-0.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(it)}
                              type="button"
                              className="btn-action-edit cursor-pointer"
                              title="Edit record"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(it._id || it.id, title)}
                              type="button"
                              className="btn-action-delete cursor-pointer"
                              title="Delete record"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <EditStatusBadge
                          editCount={it.editCount || (Array.isArray(it.editHistory) ? it.editHistory.length : 0)}
                          lastEdited={
                            (Array.isArray(it.editHistory) && it.editHistory.length > 0 && it.editHistory[it.editHistory.length - 1]?.timestamp) ||
                            it.updatedDate
                          }
                          onClick={() => onHistoryClick && onHistoryClick(it)}
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

      {/* Date Total Bar matching Image 2 */}
      <div className="px-5 py-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border-t border-emerald-200/90 dark:border-emerald-900/60 flex justify-end items-center">
        <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 mr-2">
          Total for {date}:
        </span>
        <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
          ₹{Number(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
