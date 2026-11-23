import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiShoppingCart,
  FiCreditCard,
  FiFileText,
  FiArchive,
  FiBookOpen,
  FiArrowRight,
} from 'react-icons/fi';
import { SyncLoader } from 'react-spinners';
import { fetchDashboardStats } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function Dashboard() {
  const { isAuth } = useAuth();
  const [stats, setStats] = useState({
    dailyItemsCount: 0,
    spendingTotal: 0,
    todaySpendingTotal: 0,
    todayBillsCount: 0,
    todayBillsTotal: 0,
    todayItemsTotal: 0,
    billsHistoryCount: 0,
    billsHistoryTotal: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchDashboardStats();
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format Day of Week & Time
  const dayName = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).toLowerCase();

  const todayDailyTotal = stats.todayItemsTotal || 0;
  const todayBillsSum = stats.todayBillsTotal || stats.todayHistBillsTotal || 0;
  const todaySpendingSum = stats.todaySpendingTotal || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 animate-fade-in">
      {/* Title & Date/Time Pills */}
      <div className="space-y-3 pb-2">
        <div className="flex items-center gap-3">
          <FiTrendingUp className="w-8 h-8 text-emerald-700 dark:text-emerald-400 stroke-[2.5]" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
        </div>

        <p className="text-sm sm:text-base text-stone-500 dark:text-stone-400 font-medium">
          Welcome to Maaza Cafe Management System
        </p>

        {/* Date & Time Badges */}
        <div className="flex items-center gap-3 pt-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-2xs text-xs font-semibold text-stone-700 dark:text-stone-200">
            <FiCalendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{dayName}</span>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200/90 dark:border-stone-700 bg-white dark:bg-stone-800 shadow-2xs text-xs font-semibold text-stone-700 dark:text-stone-200">
            <FiClock className="w-4 h-4 text-orange-500" />
            <span className="font-mono">{formattedTime}</span>
          </div>

          {loading && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 text-xs font-medium">
              <SyncLoader size={5} color="#d97706" />
              <span>Syncing live stats...</span>
            </div>
          )}
        </div>
      </div>

      {/* 4 Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 mt-10 sm:mt-12">
        {/* Card 1: Daily Items Bought */}
        <Link
          to="/daily-items"
          className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border-t-4 border-t-emerald-600 border-x border-b border-stone-200/90 dark:border-stone-800 shadow-sm card-hover flex flex-col justify-between space-y-5"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <FiShoppingCart className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-white">
              Daily Items Bought
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">
              Today's purchases
            </p>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-3">
              ₹{todayDailyTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </Link>

        {/* Card 2: Spending Money */}
        <Link
          to="/spending"
          className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border-t-4 border-t-amber-500 border-x border-b border-stone-200/90 dark:border-stone-800 shadow-sm card-hover flex flex-col justify-between space-y-5"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
            <FiCreditCard className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-white">
              Spending Money
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">
              Today's spending
            </p>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-3">
              {isAuth ? (
                `₹${todaySpendingSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              ) : (
                'xxxx'
              )}
            </div>
          </div>
        </Link>

        {/* Card 3: Today's Bill */}
        <Link
          to="/today-bill"
          className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border-t-4 border-t-sky-400 border-x border-b border-stone-200/90 dark:border-stone-800 shadow-sm card-hover flex flex-col justify-between space-y-5"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
            <FiFileText className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-white">
              Today's Bill
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">
              Today's bill amount
            </p>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-3">
              ₹{todayBillsSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </Link>

        {/* Card 4: Bills History */}
        <Link
          to="/bills-history"
          className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border-t-4 border-t-fuchsia-500 border-x border-b border-stone-200/90 dark:border-stone-800 shadow-sm card-hover flex flex-col justify-between space-y-5"
        >
          <div className="w-12 h-12 rounded-xl bg-[#c026d3] text-white flex items-center justify-center shadow-xs">
            <FiArchive className="w-5 h-5" />
          </div>

          <div>
            <h3 className="font-bold text-base text-stone-900 dark:text-white">
              Bills History
            </h3>
            <p className="text-xs text-stone-400 dark:text-stone-400 mt-0.5">
              Today's bill amount
            </p>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-500 mt-3">
              {isAuth ? (
                `₹${todayBillsSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              ) : (
                'xxxx'
              )}
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Access Card: Daily Notes */}
      <div className="mt-8">
        <Link
          to="/notes"
          className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-between shadow-2xs card-hover group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
              <FiBookOpen className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h4 className="font-bold text-base text-stone-900 dark:text-white flex items-center gap-2">
                <span>Daily Notes & Shift Handover</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                  New
                </span>
              </h4>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-0.5">
                Record daily cafe tasks, supplier updates, shift reports, and maintenance with timestamped history.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Open Notes</span>
            <FiArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>
    </div>
  );
}
