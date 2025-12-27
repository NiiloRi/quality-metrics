'use client';

import Link from 'next/link';
import Logo from './Logo';
import { useLanguage } from '@/lib/i18n/context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-[var(--border)] mt-16">
      {/* Main Footer */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Logo size="sm" />
            <p className="mt-4 text-sm text-[var(--foreground-muted)] max-w-md">
              {t('footer.description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-4">{t('footer.product')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/screener" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                  {t('footer.screener')}
                </Link>
              </li>
              <li>
                <Link href="/crown-jewels" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                  {t('footer.crownJewels')}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[var(--foreground)] mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Disclaimer Bar */}
      <div className="border-t border-[var(--border)] bg-[var(--background-secondary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[var(--foreground-muted)] text-center sm:text-left">
              © {new Date().getFullYear()} Quality Metrics. {t('footer.rights')}
            </p>
            <p className="text-xs text-[var(--foreground-muted)] text-center sm:text-right max-w-2xl">
              ⚠️ <strong>{t('footer.disclaimer')}</strong> {t('footer.disclaimerText')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
