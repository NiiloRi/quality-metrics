'use client';

import { Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n/context';

interface PaywallOverlayProps {
  children: React.ReactNode;
  feature?: string;
  className?: string;
}

export default function PaywallOverlay({
  children,
  feature = 'premium',
  className = '',
}: PaywallOverlayProps) {
  const { data: session } = useSession();
  const { t } = useLanguage();

  // Check if user has premium access
  const hasPremium =
    session?.user?.subscriptionTier === 'trial' ||
    session?.user?.subscriptionTier === 'premium';

  if (hasPremium) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="blur-md select-none pointer-events-none" aria-hidden="true">
        {children}
      </div>

      {/* Overlay with CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/60 backdrop-blur-sm rounded-xl">
        <div className="text-center p-6 max-w-sm">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            {t('paywall.title')}
          </h3>
          <p className="text-sm text-[var(--foreground-secondary)] mb-4">
            {t('paywall.description')}
          </p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-semibold rounded-full hover:from-amber-600 hover:to-yellow-600 transition-all shadow-lg shadow-amber-500/25"
          >
            {t('paywall.cta')}
          </a>
          <p className="text-xs text-[var(--foreground-muted)] mt-3">
            {t('paywall.trial')}
          </p>
        </div>
      </div>
    </div>
  );
}
