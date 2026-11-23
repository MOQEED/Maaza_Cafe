import React from 'react';
import ThumbnailImage from './ThumbnailImage';
import EditStatusBadge from './EditStatusBadge';

export default function MobileCardHeader({
  title,
  image,
  editCount,
  amount,
  subtitle,
  onImageClick,
  onHistoryClick,
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-3">
        <ThumbnailImage
          src={image}
          alt={title}
          onClick={onImageClick}
          size="md"
        />

        <div>
          <h4 className="font-bold text-sm text-stone-900 dark:text-white leading-tight">
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <EditStatusBadge editCount={editCount} onClick={onHistoryClick} />
          </div>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-base font-extrabold text-amber-600 dark:text-amber-400">
          ₹{amount}
        </div>
        {subtitle && (
          <div className="text-[11px] text-stone-400">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
