'use client';

import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Filter, CheckCircle2, ArrowRight, Zap, Shield, Target } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import Logo from '@/components/Logo';
import GlowCard from '@/components/GlowCard';
import CompanyLogo from '@/components/CompanyLogo';
import LanguageToggle from '@/components/LanguageToggle';
import UserMenu from '@/components/UserMenu';
import { useLanguage } from '@/lib/i18n/context';

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
];

const qmCriteria = [
  { name: '5Y P/E', threshold: '< 22.5', description: 'Price to 5-year cumulative earnings', icon: '📊', color: 'from-blue-500/20 to-cyan-500/20', accent: 'text-cyan-400' },
  { name: '5Y ROIC', threshold: '> 9%', description: 'Return on invested capital', icon: '💰', color: 'from-emerald-500/20 to-teal-500/20', accent: 'text-emerald-400' },
  { name: 'Share Count', threshold: 'Decreasing', description: 'Shares outstanding trend', icon: '📉', color: 'from-violet-500/20 to-purple-500/20', accent: 'text-violet-400' },
  { name: 'FCF Growth', threshold: 'Growing', description: 'Free cash flow trajectory', icon: '💵', color: 'from-green-500/20 to-emerald-500/20', accent: 'text-green-400' },
  { name: 'Earnings Growth', threshold: 'Growing', description: 'Net income trajectory', icon: '📈', color: 'from-amber-500/20 to-orange-500/20', accent: 'text-amber-400' },
  { name: 'Revenue Growth', threshold: 'Growing', description: 'Top line trajectory', icon: '🚀', color: 'from-rose-500/20 to-pink-500/20', accent: 'text-rose-400' },
  { name: 'Debt/FCF', threshold: '< 5x', description: 'Leverage vs cash generation', icon: '🛡️', color: 'from-sky-500/20 to-blue-500/20', accent: 'text-sky-400' },
  { name: '5Y P/FCF', threshold: '< 22.5', description: 'Price to 5-year cumulative FCF', icon: '⚡', color: 'from-yellow-500/20 to-amber-500/20', accent: 'text-yellow-400' },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 nav-glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo size="md" />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/crown-jewels"
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full hover:from-amber-600 hover:to-yellow-600 transition-colors shadow-lg shadow-amber-500/20"
              >
                👑 {t('nav.crownJewels')}
              </Link>
              <Link
                href="/screener"
                className="px-4 py-2 text-sm font-medium text-[var(--foreground)] bg-[var(--card)] rounded-full border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors"
              >
                {t('nav.rankings')}
              </Link>
              <LanguageToggle />
              <div className="hidden sm:block w-64">
                <SearchBar />
              </div>
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Text - Left */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                <span className="text-[var(--foreground)]">{t('hero.discover')} </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">{t('hero.qualityStocks')}</span>
              </h1>
              <p className="mt-6 text-lg text-[var(--foreground-secondary)] leading-relaxed max-w-xl lg:max-w-none">
                {t('hero.subtitle')}
              </p>

              {/* Search - Mobile */}
              <div className="sm:hidden max-w-md mx-auto lg:mx-0 mt-8">
                <SearchBar />
              </div>
            </div>

            {/* Mascot - Right */}
            <div className="flex-1 flex justify-center lg:justify-end">
              <Image
                src="/mascot.png"
                alt="QM Bull Mascot - No BS, QM!"
                width={500}
                height={500}
                className="w-80 sm:w-96 lg:w-[30rem] drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Popular Stocks Grid */}
      <section className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-[var(--foreground-muted)] mb-6">{t('popular.title')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularStocks.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="card-professional p-4 flex items-center gap-4"
              >
                {/* Company Logo */}
                <div className="w-12 h-12 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  <CompanyLogo symbol={stock.symbol} name={stock.name} />
                </div>

                {/* Stock Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--foreground)]">{stock.name}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{stock.symbol}</p>
                </div>

                {/* Arrow */}
                <ArrowRight className="w-5 h-5 text-[var(--foreground-muted)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              {t('features.title')}
            </h2>
            <p className="mt-3 text-[var(--foreground-secondary)]">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlowCard className="p-6">
              <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{t('features.qualityScore.title')}</h3>
              <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
                {t('features.qualityScore.description')}
              </p>
            </GlowCard>

            <GlowCard className="p-6">
              <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{t('features.valuation.title')}</h3>
              <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
                {t('features.valuation.description')}
              </p>
            </GlowCard>

            <GlowCard className="p-6">
              <div className="w-12 h-12 bg-blue-500/15 rounded-xl flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">{t('features.screener.title')}</h3>
              <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
                {t('features.screener.description')}
              </p>
              <Link
                href="/screener"
                className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
              >
                {t('features.openScreener')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* QM Criteria */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              {t('qm.title')}
            </h2>
            <p className="mt-3 text-[var(--foreground-secondary)]">
              {t('qm.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {qmCriteria.map((criterion, index) => (
              <div
                key={criterion.name}
                className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg hover:-translate-y-1"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${criterion.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                {/* Number badge */}
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[var(--background-secondary)] flex items-center justify-center">
                  <span className="text-xs font-bold text-[var(--foreground-muted)]">{index + 1}</span>
                </div>

                {/* Content */}
                <div className="relative">
                  <div className="text-3xl mb-3">{criterion.icon}</div>
                  <h4 className="font-bold text-[var(--foreground)] text-base mb-2">
                    {criterion.name}
                  </h4>
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${criterion.accent} bg-[var(--background-secondary)] mb-3`}>
                    {criterion.threshold}
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">
                    {criterion.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
              {t('howItWorks.title')}
            </h2>
            <p className="mt-3 text-[var(--foreground-secondary)]">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <GlowCard className="p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">{t('howItWorks.step1.title')}</h4>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      {t('howItWorks.step1.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">{t('howItWorks.step2.title')}</h4>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      {t('howItWorks.step2.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[var(--foreground)]">{t('howItWorks.step3.title')}</h4>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      {t('howItWorks.step3.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-[var(--background-tertiary)] rounded-xl">
                <p className="text-center text-sm text-[var(--foreground-secondary)]">
                  <span className="font-semibold text-[var(--foreground)]">{t('howItWorks.example')} </span>
                  {t('howItWorks.exampleText')}
                </p>
              </div>
            </GlowCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="text-sm text-[var(--foreground-muted)]">
              {t('footer.dataProvider')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
