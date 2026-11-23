import React from 'react';

export default function MobileCardRow({ label, value, icon: Icon, className = '' }) {
  return (
    <div className={`flex items-center justify-between text-xs text-stone-600 dark:text-stone-300 ${className}`}>
      <span className="flex items-center gap-1.5 text-stone-400">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        <span>{label}</span>
      </span>
      <span className="font-semibold text-stone-800 dark:text-stone-200">
        {value}
      </span>
    </div>
  );
}
