import React from 'react';
import { FiImage, FiDownload, FiX } from 'react-icons/fi';
import { getImageUrl } from '../../services/api';

export default function ImagePreview({ isOpen, onClose, src, title = 'Image Preview' }) {
  if (!isOpen || !src) return null;

  const fullUrl = getImageUrl(src);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = `maaza-image-${Date.now()}.png`;
    link.target = '_blank';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-2 text-stone-900 dark:text-white font-semibold text-sm">
            <FiImage className="w-4 h-4 text-amber-500" />
            <span className="truncate">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              title="Download image"
              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <FiDownload className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="p-4 bg-stone-100 dark:bg-stone-950 flex items-center justify-center min-h-[320px] max-h-[70vh] overflow-auto">
          <img
            src={fullUrl}
            alt={title}
            className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-md"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80';
            }}
          />
        </div>
      </div>
    </div>
  );
}
