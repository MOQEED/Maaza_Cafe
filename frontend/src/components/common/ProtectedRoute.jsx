import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { FiLock, FiLogIn, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';

/**
 * ProtectedRoute component for React Router 7
 * Renders protected content if user is authenticated;
 * Otherwise displays a clear, elegant cafe access gate with 1-click login.
 */
export default function ProtectedRoute({ children, fallbackMode = 'card' }) {
  const { isAuth } = useAuth();
  const location = useLocation();

  if (!isAuth) {
    if (fallbackMode === 'redirect') {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6 animate-fade-in">
        <div className="relative w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 dark:from-amber-950/80 dark:to-orange-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-md border border-amber-200/50 dark:border-amber-800/50">
          <FiLock className="w-8 h-8" />
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-sm">
            <FiShield className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-stone-900 dark:text-white">
            Manager Access Protected
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            This section contains restricted financial or administrative data. Please log in with your manager credentials to proceed.
          </p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            state={{ from: location }}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            <FiLogIn className="w-4 h-4" />
            <span>Login to Access</span>
          </Link>
        </div>

        <div className="text-xs text-stone-400 dark:text-stone-500">
          Default Admin Login: <span className="font-mono font-medium text-stone-600 dark:text-stone-300">admin</span> / <span className="font-mono font-medium text-stone-600 dark:text-stone-300">admin123</span>
        </div>
      </div>
    );
  }

  return children;
}
