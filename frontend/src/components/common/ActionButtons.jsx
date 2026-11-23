import React from 'react';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

export default function ActionButtons({ onEdit, onDelete, editLabel = 'Edit', deleteLabel = 'Delete' }) {
  return (
    <div className="flex items-center gap-2">
      {onEdit && (
        <button
          onClick={onEdit}
          type="button"
          title={editLabel}
          className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-950/60 transition-all active:scale-95 border border-amber-200/40 dark:border-amber-900/40 cursor-pointer"
        >
          <FiEdit2 className="w-4 h-4" />
        </button>
      )}

      {onDelete && (
        <button
          onClick={onDelete}
          type="button"
          title={deleteLabel}
          className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/60 transition-all active:scale-95 border border-rose-200/40 dark:border-rose-900/40 cursor-pointer"
        >
          <FiTrash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
