import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import MobileBottomNav from './components/common/MobileBottomNav';
import ProtectedRoute from './components/common/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import DailyItems from './pages/DailyItems';
import TodayBill from './pages/TodayBill';
import Spending from './pages/Spending';
import BillsHistory from './pages/BillsHistory';
import Notes from './pages/Notes';
import AdminSettings from './pages/AdminSettings';
import Login from './pages/Login';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-primary)] transition-colors duration-300">
          <Navbar />

          <main className="flex-1 pb-16 md:pb-0">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/daily-items" element={<DailyItems />} />
              <Route path="/daily" element={<DailyItems />} />
              <Route path="/today-bill" element={<TodayBill />} />
              <Route path="/notes" element={<Notes />} />

              {/* Protected Routes (React Router 7 Protected Route Pattern) */}
              <Route
                path="/spending"
                element={
                  <ProtectedRoute>
                    <Spending />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bills-history"
                element={
                  <ProtectedRoute>
                    <BillsHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bills"
                element={
                  <ProtectedRoute>
                    <BillsHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminSettings />
                  </ProtectedRoute>
                }
              />

              {/* Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Fixed Mobile Bottom Navigation for Phone / Tablet */}
          <MobileBottomNav />

          {/* Clean Cafe Footer */}
          <footer className="py-8 text-center text-xs text-stone-400 dark:text-stone-500 mb-14 md:mb-0">
            <p>© 2026 Maaza Cafe Management System • Built with React 19 & Vite 6</p>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
