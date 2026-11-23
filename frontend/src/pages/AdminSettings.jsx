import React, { useState } from 'react';
import {
  FiSettings,
  FiShield,
  FiEye,
  FiEyeOff,
  FiUserCheck,
  FiAlertCircle,
  FiRotateCcw,
} from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '../context/useAuth';
import { updateAdminCredentials } from '../services/api';
import ToastNotification from '../components/common/ToastNotification';

export default function AdminSettings() {
  const { user, updateUserSession } = useAuth();

  const [currentUsername, setCurrentUsername] = useState(user?.username || 'admin');
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const [error, setError] = useState('');

  const handleReset = () => {
    setNewUsername('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Current password is required to verify ownership and apply changes.');
      return;
    }

    if (!newUsername.trim() && !newPassword.trim()) {
      setError('Please provide a new Login ID or a new Password to update.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify your new password.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateAdminCredentials({
        currentPassword,
        newUsername: newUsername.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });

      if (res.success) {
        updateUserSession(res.token, res.user);
        setCurrentUsername(res.user.username);
        setToast({
          message: `Credentials updated successfully! Login ID is now "${res.user.username}".`,
          type: 'success',
        });
        handleReset();
      } else {
        setError(res.message || 'Failed to update credentials.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid current password or server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20 space-y-8 animate-fade-in">
      <ToastNotification
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      {/* Top Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
          <FiSettings className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
          Admin Settings
        </h1>
      </div>

      {/* Main Settings Card */}
      <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xs space-y-5">
        {/* Purple current username pill */}
        <div className="p-4 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-purple-900 dark:text-purple-300">
            <FiUserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Current username: <strong className="font-extrabold text-purple-700 dark:text-purple-300">{user?.username || currentUsername}</strong></span>
          </div>
          <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2.5 py-1 rounded-full">
            Active Session
          </span>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
              <span>Current Password <span className="text-rose-500">*</span></span>
              <span className="text-[11px] text-stone-400 font-normal">Required for security verification</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="form-input-box pr-10"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPass(!showCurrentPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showCurrentPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Username Field */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              New Username <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="form-input-box"
              placeholder="Leave blank to keep current username"
            />
          </div>

          {/* New Password Field */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              New Password <span className="text-stone-400 font-normal">(optional)</span>
            </label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input-box pr-10"
                placeholder="Enter new password (min 4 characters)"
              />
              <button
                type="button"
                onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                {showNewPass ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          {newPassword && (
            <div className="space-y-1.5 pt-1 animate-fade-in">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!!newPassword}
                className="form-input-box"
                placeholder="Re-enter your new password"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-green active:scale-95 px-5 py-2.5 text-xs font-bold shadow-xs gap-1.5 flex items-center cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <ClipLoader size={14} color="#ffffff" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <FiShield className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Save Credentials</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="btn-white active:scale-95 px-4 py-2.5 text-xs font-bold gap-1.5 flex items-center cursor-pointer"
            >
              <FiRotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </form>

        {/* Important Notes box */}
        <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
            <span>Important Notes:</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-stone-600 dark:text-stone-400">
            <li>Changing your Login ID will update the username you use to log into Maaza Cafe.</li>
            <li>Your session token is refreshed automatically — you will stay logged in seamlessly.</li>
            <li>Make sure to remember your new password; you will need it next time you log in.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
