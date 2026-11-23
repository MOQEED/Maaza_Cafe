import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiGrid,
  FiShoppingCart,
  FiFileText,
  FiCreditCard,
  FiArchive,
  FiSettings,
  FiLogIn,
  FiBookOpen,
} from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';

export default function MobileBottomNav() {
  const { isAuth } = useAuth();

  const navItems = [
    { to: '/', label: 'Home', icon: FiGrid },
    { to: '/daily-items', label: 'Daily', icon: FiShoppingCart },
    { to: '/today-bill', label: "Today's", icon: FiFileText },
    { to: '/notes', label: 'Notes', icon: FiBookOpen },
    ...(isAuth
      ? [
          { to: '/spending', label: 'Spending', icon: FiCreditCard },
          { to: '/bills-history', label: 'Bills', icon: FiArchive },
          { to: '/admin', label: 'Admin', icon: FiSettings },
        ]
      : [{ to: '/login', label: 'Login', icon: FiLogIn }]),
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 border-t border-stone-200/90 dark:border-stone-800/90 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.35rem)' }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                isActive
                  ? 'text-[#276749] dark:text-emerald-400 font-bold scale-105'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-emerald-100/70 dark:bg-emerald-950/60'
                      : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] leading-none mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
