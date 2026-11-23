import React, { useState } from 'react';
import { FiX, FiUserCheck, FiKey, FiEye, FiEyeOff, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import { updateAdminCredentials } from '../services/api';
import { useAuth } from '../context/useAuth';

export default function AdminProfileModal({ isOpen, onClose, onNotify }) {
  const { user, updateUserSession } = useAuth();

  const [newUsername, setNewUsername] = useState(user?.username || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Current password is required to save changes.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('New password must be at least 4 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateAdminCredentials({
        currentPassword,
        newUsername: newUsername.trim(),
        newPassword: newPassword.trim() || undefined,
      });

      if (res.success) {
        updateUserSession(res.token, res.user);
        if (onNotify) {
          onNotify({
            message: `Account updated successfully! Login ID is now: ${res.user.username}`,
            type: 'success',
          });
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      } else {
        setError(res.message || 'Failed to update credentials.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Invalid current password or server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <FiUserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-white text-base sm:text-lg">
                Admin Profile
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Change Manager username and password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Admin Username / Login ID
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
              className="form-input-box"
              placeholder="e.g. admin"
            />
          </div>

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FiKey className="w-3.5 h-3.5 text-amber-600" />
                <span>Current Password <span className="text-rose-500">*</span></span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">Default: admin123</span>
            </label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="form-input-box pr-10"
                placeholder="Enter current password"
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

          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-3">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block">
              Change Password (Optional)
            </span>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input-box pr-10"
                  placeholder="Leave blank to keep same password"
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

            {/* Confirm New Password */}
            {newPassword && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input-box"
                  placeholder="Re-enter new password"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-white text-xs px-4 py-2 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-green text-xs px-5 py-2 active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <ClipLoader size={14} color="#ffffff" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
