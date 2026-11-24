import React, { useState, useEffect } from 'react';
import { FiDownload, FiX, FiShare, FiPlusSquare, FiMoreVertical, FiCheckCircle } from 'react-icons/fi';

export default function InstallAppButton({ className = '' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone app mode
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standaloneMode);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    setIsIOS(isAppleDevice);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Don't render if already running as an installed standalone app
  if (isStandalone) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsStandalone(true);
        }
      } catch (err) {
        console.error('PWA install prompt error:', err);
      } finally {
        setDeferredPrompt(null);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-sm transition-all transform active:scale-95 cursor-pointer ${className}`}
        title="Install Maaza Cafe as an App on your device"
      >
        <FiDownload className="w-3.5 h-3.5 animate-bounce" />
        <span>Install App</span>
      </button>

      {/* Guide Modal for iOS or manual install */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-stone-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 dark:border-stone-800 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg"
            >
              <FiX className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                <FiDownload className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-stone-900 dark:text-white">
                Install Maaza Cafe
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Install this app on your phone, tablet, or PC for full-screen mode & quick access!
              </p>
            </div>

            <div className="space-y-3.5 text-xs text-stone-600 dark:text-stone-300">
              {isIOS ? (
                <>
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600">
                      <FiShare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-100">Step 1:</span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Tap the <strong>Share</strong> button at the bottom of Safari.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600">
                      <FiPlusSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-100">Step 2:</span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                      <FiMoreVertical className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-100">Android Chrome:</span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Tap the <strong>3 dots (⋮)</strong> at top right &rarr; tap <strong>"Install app"</strong>.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600">
                      <FiCheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-stone-800 dark:text-stone-100">Windows / Laptop:</span>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400">Click the <strong>Install</strong> icon in your browser address bar.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-5 w-full py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
