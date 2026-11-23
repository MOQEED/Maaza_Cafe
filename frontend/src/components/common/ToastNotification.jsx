import React, { useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export default function ToastNotification({
  message,
  type = 'success', // 'success' | 'error' | 'info'
  onClose,
  duration = 4000,
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-rose-900/95 text-rose-100 border-rose-700 shadow-rose-900/40';
      case 'info':
        return 'bg-amber-900/95 text-amber-100 border-amber-700 shadow-amber-900/40';
      case 'success':
      default:
        return 'bg-emerald-900/95 text-emerald-100 border-emerald-700 shadow-emerald-900/40';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-rose-300 flex-shrink-0" />;
      case 'info':
        return <FiInfo className="w-5 h-5 text-amber-300 flex-shrink-0" />;
      case 'success':
      default:
        return <FiCheckCircle className="w-5 h-5 text-emerald-300 flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-fade-in max-w-sm">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-lg ${getTypeStyles()}`}
      >
        {getIcon()}
        <span className="text-xs font-semibold flex-1 leading-snug">{message}</span>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
