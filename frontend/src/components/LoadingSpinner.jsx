import React from 'react';
import { SyncLoader, ClipLoader } from 'react-spinners';
import { FiCoffee } from 'react-icons/fi';

/**
 * Modern Loading Spinner component utilizing react-spinners
 * Supports both standalone hero loader and inline button/row loader
 */
export default function LoadingSpinner({
  message = 'Brewing data...',
  inline = false,
  size = 10,
  color = '#d97706',
}) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-2">
        <ClipLoader size={size || 16} color="currentColor" speedMultiplier={0.9} />
        {message && <span className="text-xs">{message}</span>}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-4 animate-fade-in">
      <div className="relative p-4 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 shadow-sm">
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
          <span className="w-1 h-2 bg-amber-400/80 rounded-full steam-element" />
          <span className="w-1 h-2.5 bg-amber-300/90 rounded-full steam-element" />
        </div>
        <FiCoffee className="w-7 h-7" />
      </div>

      <div className="pt-1">
        <SyncLoader color={color} size={size} speedMultiplier={0.8} />
      </div>

      <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 tracking-wide">
        {message}
      </p>
    </div>
  );
}
