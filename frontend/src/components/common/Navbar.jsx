import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiCoffee,
  FiGrid,
  FiShoppingCart,
  FiCreditCard,
  FiFileText,
  FiArchive,
  FiSettings,
  FiLogOut,
  FiLogIn,
  FiSun,
  FiMoon,
  FiMenu,
  FiX,
  FiBookOpen,
} from 'react-icons/fi';
import { useAuth } from '../../context/useAuth';
import { getThemePreference, setThemePreference } from '../../utils/cookies';
import InstallAppButton from './InstallAppButton';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuth, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark mode state using cookies and classList
  const [isDark, setIsDark] = useState(() => {
    return document.documentElement.classList.contains('dark') || getThemePreference() === 'dark';
  });

  const toggleDarkMode = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      setThemePreference('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setThemePreference('light');
    }
  };

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: FiGrid },
    { to: '/daily-items', label: 'Daily Items', icon: FiShoppingCart },
    { to: '/spending', label: 'Spending', icon: FiCreditCard },
    { to: '/today-bill', label: "Today's Bill", icon: FiFileText },
    { to: '/bills-history', label: 'Bills History', icon: FiArchive },
    { to: '/notes', label: 'Notes', icon: FiBookOpen },
    { to: '/admin', label: 'Admin', icon: FiSettings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-stone-900/95 border-b border-stone-200/80 dark:border-stone-800 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Cafe Brand */}
          <Link
            to="/"
            className="flex items-center gap-2.5 focus:outline-none group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="absolute -top-1 left-2.5 flex gap-0.5 pointer-events-none">
                <span className="w-0.5 h-1.5 bg-amber-300 rounded-full steam-element" />
                <span className="w-0.5 h-2 bg-amber-200 rounded-full steam-element" />
              </div>
              <FiCoffee className="w-5 h-5 text-amber-200" />
            </div>

            <div>
              <div className="text-sm font-black text-stone-900 dark:text-white leading-tight">
                Maaza Cafe
              </div>
              <div className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                Management System
              </div>
            </div>
          </Link>

          {/* Center Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-[#276749] text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Install App Button */}
            <InstallAppButton />

            {/* Dark Mode Icon */}
            <button
              onClick={toggleDarkMode}
              className="p-1.5 rounded-lg text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-amber-400 transition-colors cursor-pointer"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <FiSun className="w-4 h-4 text-amber-400" /> : <FiMoon className="w-4 h-4" />}
            </button>

            {/* Auth Button */}
            {isAuth ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 hover:bg-amber-100 dark:hover:bg-amber-950/60 hover:text-amber-900 dark:hover:text-amber-300 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Click to change your Login ID and Password"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-medium">{user?.username || 'admin'}</span>
                  <FiSettings className="w-3.5 h-3.5 text-stone-400 group-hover:text-amber-500" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <FiLogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <FiLogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Burger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              {mobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 space-y-1.5 animate-fade-in">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                  active
                    ? 'bg-[#276749] text-white'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
