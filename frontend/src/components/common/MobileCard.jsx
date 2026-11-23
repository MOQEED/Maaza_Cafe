import React from 'react';
import { FiCalendar, FiClock, FiImage } from 'react-icons/fi';
import ActionButtons from './ActionButtons';
import EditStatusBadge from './EditStatusBadge';
import { getImageUrl } from '../../services/api';

export default function MobileCard({
  item,
  onEdit,
  onDelete,
  onImageClick,
  onHistoryClick,
  isBill = false,
}) {
  const title = item.itemName || item.billName || 'Item';
  const total = Number(item.totalPrice || item.amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3 card-hover">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {item.image ? (
            <button
              onClick={() => onImageClick && onImageClick(item.image, title)}
              className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 flex-shrink-0 group cursor-pointer"
              title="Click to view image"
            >
              <img
                src={getImageUrl(item.image)}
                alt={title}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
            </button>
          ) : (
            <div className="w-12 h-12 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-center text-stone-400 flex-shrink-0">
              <FiImage className="w-5 h-5 opacity-40" />
            </div>
          )}

          <div>
            <h4 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <EditStatusBadge
                editCount={item.editCount}
                onClick={() => onHistoryClick && onHistoryClick(item)}
              />
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
            ₹{total}
          </div>
          {!isBill && item.quantity && item.price && (
            <div className="text-[11px] text-stone-400">
              {item.quantity} × ₹{item.price}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp & Metadata Footer */}
      <div className="pt-2.5 border-t border-stone-100 dark:border-stone-800/80 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1">
            <FiCalendar className="w-3.5 h-3.5 text-stone-400" />
            {item.date || item.groupDate}
          </span>
          {item.time && (
            <span className="flex items-center gap-1">
              <FiClock className="w-3.5 h-3.5 text-stone-400" />
              {item.time}
            </span>
          )}
        </div>

        {(onEdit || onDelete) && (
          <ActionButtons
            onEdit={onEdit ? () => onEdit(item) : null}
            onDelete={onDelete ? () => onDelete(item._id || item.id) : null}
          />
        )}
      </div>
    </div>
  );
}
