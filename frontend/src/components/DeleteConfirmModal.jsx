import React from 'react';
import { FiAlertTriangle, FiTrash2, FiX } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Confirmation',
  itemName = 'this record',
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
              <FiAlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-base">
                {title}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Irreversible action
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          Are you sure you want to delete <strong className="text-stone-900 dark:text-white font-bold">"{itemName}"</strong>? This record will be permanently removed.
        </p>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <ClipLoader size={14} color="#ffffff" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
