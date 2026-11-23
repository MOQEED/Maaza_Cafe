import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiCoffee, FiLogIn, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { ClipLoader } from 'react-spinners';
import { useAuth } from '../context/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.message || 'Invalid username or password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDefault = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  return (
    <div className="min-h-[84vh] flex items-center justify-center px-4 py-10 animate-fade-in">
      <div className="w-full max-w-[420px] p-8 sm:p-10 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 shadow-xl space-y-6">
        {/* Coffee Cup in Gradient Square with Steam */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-800 to-stone-900 text-white flex items-center justify-center shadow-lg">
            <div className="absolute -top-1 left-4 flex gap-1 pointer-events-none">
              <span className="w-1 h-3 bg-amber-300 rounded-full steam-element" />
              <span className="w-1 h-4 bg-amber-200 rounded-full steam-element" />
              <span className="w-1 h-3 bg-amber-400 rounded-full steam-element" />
            </div>
            <FiCoffee className="w-8 h-8 text-amber-200" />
          </div>
          <h2 className="text-2xl font-black text-stone-900 dark:text-white pt-1 tracking-tight">
            Maaza Cafe
          </h2>
          <p className="text-xs text-stone-400 font-medium">
            Management & Operations Portal
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="form-input-box"
              placeholder="e.g. admin"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input-box pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl btn-green justify-center text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <ClipLoader size={16} color="#ffffff" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <FiLogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Default Credential helper */}
        <div className="text-center pt-1 border-t border-stone-100 dark:border-stone-800/80">
          <button
            type="button"
            onClick={fillDefault}
            className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline transition-colors font-semibold cursor-pointer"
          >
            Click here to auto-fill default admin credentials
          </button>
        </div>
      </div>
    </div>
  );
}
