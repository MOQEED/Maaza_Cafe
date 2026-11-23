import React from 'react';
import { FiImage } from 'react-icons/fi';
import { getImageUrl } from '../services/api';

export default function ThumbnailImage({
  src,
  alt = 'Image',
  onClick,
  size = 'md', // sm: 8x8, md: 10x10, lg: 12x12
  className = '',
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;
  const fullUrl = getImageUrl(src);

  if (!src) {
    return (
      <div
        className={`${currentSize} rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/40 flex items-center justify-center text-stone-400 flex-shrink-0 ${className}`}
      >
        <FiImage className="w-4 h-4 opacity-40" />
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      type="button"
      title="Click to zoom image"
      className={`relative ${currentSize} rounded-xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform flex-shrink-0 group cursor-pointer ${className}`}
    >
      <img
        src={fullUrl}
        alt={alt}
        className="w-full h-full object-cover transition-transform group-hover:scale-110"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=200&auto=format&fit=crop&q=80';
        }}
      />
    </button>
  );
}
