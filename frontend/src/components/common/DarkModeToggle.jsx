import React, { useState, useEffect } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { getThemePreference, setThemePreference } from '../../utils/cookies';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    const saved = getThemePreference();
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      setThemePreference('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setThemePreference('light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 text-stone-700 dark:text-stone-300 transition-all flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
      type="button"
    >
      {isDark ? (
        <FiSun className="w-5 h-5 text-amber-400 animate-fade-in" />
      ) : (
        <FiMoon className="w-5 h-5 text-stone-700 animate-fade-in" />
      )}
    </button>
  );
}
