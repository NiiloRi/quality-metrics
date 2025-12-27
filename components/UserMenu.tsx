'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Crown, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/context';

export default function UserMenu() {
  const { data: session, status } = useSession();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-[var(--background-secondary)] animate-pulse" />
    );
  }

  if (!session) {
    return (
      <Link
        href="/login"
        className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] rounded-full border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
      >
        Sign in
      </Link>
    );
  }

  const { user } = session;
  const isPremium = user.subscriptionTier === 'premium';
  const isTrial = user.subscriptionTier === 'trial';
  const trialDaysLeft = user.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(user.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full bg-[var(--card)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-7 h-7 rounded-full"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
            <User className="w-4 h-4 text-[var(--foreground-muted)]" />
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-[var(--foreground-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="p-4 border-b border-[var(--border)]">
            <p className="font-medium text-[var(--foreground)] truncate">{user.name}</p>
            <p className="text-sm text-[var(--foreground-muted)] truncate">{user.email}</p>

            {/* Subscription badge */}
            <div className="mt-3">
              {isPremium ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/15 text-amber-400 text-xs font-semibold rounded-full">
                  <Crown className="w-3.5 h-3.5" />
                  {t('user.premium')}
                </span>
              ) : isTrial ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/15 text-blue-400 text-xs font-semibold rounded-full">
                  {t('user.trial')} • {trialDaysLeft} {t('user.trialDays')}
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 bg-[var(--background-secondary)] text-[var(--foreground-muted)] text-xs font-semibold rounded-full">
                    {t('user.free')}
                  </span>
                  <Link
                    href="/pricing"
                    className="text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {t('user.upgrade')} →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('user.signOut')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
