import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Modal } from './Modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallButton: React.FC<{ label?: string; compact?: boolean }> = ({
  label = 'Install App',
  compact = false,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      // General instructions modal
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        aria-label="Install BOARDPASS application"
        className={`min-h-[44px] flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ${
          compact ? 'px-3 py-1.5 text-xs' : 'w-full py-3 px-4 text-sm'
        }`}
        style={{ backgroundColor: 'var(--card-subtle)', color: 'var(--accent)' }}
      >
        <Download className="w-4 h-4" />
        <span>{label}</span>
      </button>

      <Modal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        title="Install BOARDPASS"
      >
        <div className="space-y-4 text-sm text-[var(--text)]">
          <p className="text-[var(--muted)] leading-relaxed">
            Install BOARDPASS to your home screen for instant offline access during ward shifts:
          </p>

          <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted)]">
            <li>
              Tap the <strong className="text-[var(--text)]">Share</strong> icon in your browser toolbar.
            </li>
            <li>
              Scroll down and select <strong className="text-[var(--text)]">Add to Home Screen</strong>.
            </li>
            <li>
              Tap <strong className="text-[var(--text)]">Add</strong> in the top right corner.
            </li>
          </ol>

          <button
            type="button"
            onClick={() => setShowIOSModal(false)}
            className="w-full min-h-[44px] mt-2 py-2.5 rounded-lg text-sm font-semibold bg-[var(--card-subtle)] text-[var(--text)]"
          >
            Got it
          </button>
        </div>
      </Modal>
    </>
  );
};
