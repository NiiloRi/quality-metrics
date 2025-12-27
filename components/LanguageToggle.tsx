'use client';

import { useLanguage } from '@/lib/i18n/context';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'fi' ? 'en' : 'fi')}
      className="px-3 py-1.5 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] rounded-full border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors flex items-center gap-1.5"
      title={lang === 'fi' ? 'Switch to English' : 'Vaihda suomeksi'}
    >
      {lang === 'fi' ? (
        <>
          <span className="text-base">🇬🇧</span>
          <span>EN</span>
        </>
      ) : (
        <>
          <span className="text-base">🇫🇮</span>
          <span>FI</span>
        </>
      )}
    </button>
  );
}
