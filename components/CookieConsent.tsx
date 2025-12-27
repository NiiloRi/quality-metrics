'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/context';

export default function CookieConsent() {
  const { t } = useLanguage();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[var(--background)] border-t border-[var(--border)] shadow-lg">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[var(--foreground-muted)] text-center sm:text-left">
          {t('cookie.message')}
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            {t('cookie.decline')}
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            {t('cookie.accept')}
          </button>
        </div>
      </div>
    </div>
  );
}
