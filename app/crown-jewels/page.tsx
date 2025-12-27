'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Crown, Diamond, TrendingUp, TrendingDown, BarChart3, Shield, Zap, RefreshCw, ChevronRight, Info } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import Logo from '@/components/Logo';
import GlowCard from '@/components/GlowCard';

interface CrownJewel {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCapB: number;
  tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver';
  tierIcon: string;
  baseScore: number;
  adjustedScore: number;
  macroBonus: number;
  qmScore: number;
  valueGapPercent: number;
  roic5yPercent: number;
  fcfYieldPercent: number;
  revenueGrowth5yPercent: number;
  incomeGrowth5yPercent: number;
  sharesChange5yPercent: number;
  hasBuybacks: boolean;
}

interface SectorRanking {
  sector: string;
  score: number;
  outlook: 'bullish' | 'neutral' | 'bearish';
  reasoning: string;
}

interface MacroEnvironment {
  phase: string;
  liquidity: string;
  sentiment: string;
  fedFundsRate: number;
  inflation: number;
  vix: number;
  lastUpdated: string;
}

interface ApiResponse {
  success: boolean;
  timestamp: string;
  macroEnvironment: MacroEnvironment;
  sectorRankings: SectorRanking[];
  totalCount: number;
  crownJewels: CrownJewel[];
  summary: {
    crownJewelCount: number;
    diamondCount: number;
    goldCount: number;
    silverCount: number;
    topSector: string;
    averageValueGap: number;
  };
}

function TierBadge({ tier }: { tier: string }) {
  const config: Record<string, { icon: React.ReactNode; bg: string; text: string; border: string; label: string }> = {
    'crown-jewel': {
      icon: <Crown className="w-4 h-4" />,
      bg: 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20',
      text: 'text-amber-300',
      border: 'border-amber-500/40',
      label: 'Crown Jewel',
    },
    'diamond': {
      icon: <Diamond className="w-4 h-4" />,
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-300',
      border: 'border-cyan-500/40',
      label: 'Diamond',
    },
    'gold': {
      icon: <span className="text-lg">🥇</span>,
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-300',
      border: 'border-yellow-500/40',
      label: 'Gold',
    },
    'silver': {
      icon: <span className="text-lg">🥈</span>,
      bg: 'bg-slate-400/20',
      text: 'text-slate-300',
      border: 'border-slate-400/40',
      label: 'Silver',
    },
  };

  const { icon, bg, text, border, label } = config[tier] || config['silver'];

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${bg} ${text} ${border} border`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

function ScoreCircle({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  const color = score >= 95 ? 'from-amber-400 to-yellow-500' :
                score >= 85 ? 'from-cyan-400 to-blue-500' :
                score >= 70 ? 'from-yellow-400 to-amber-500' :
                'from-slate-400 to-slate-500';

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white shadow-lg`}>
        {score}
      </div>
      <span className="text-xs text-[var(--foreground-muted)] mt-1">{label}</span>
    </div>
  );
}

function MacroBonusBadge({ bonus }: { bonus: number }) {
  if (bonus === 0) {
    return <span className="text-xs text-[var(--foreground-muted)]">±0</span>;
  }

  const isPositive = bonus > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{bonus}
    </span>
  );
}

function SectorOutlookBadge({ outlook }: { outlook: string }) {
  const config: Record<string, { bg: string; text: string }> = {
    bullish: { bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
    neutral: { bg: 'bg-amber-500/20', text: 'text-amber-300' },
    bearish: { bg: 'bg-rose-500/20', text: 'text-rose-300' },
  };

  const { bg, text } = config[outlook] || config.neutral;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      {outlook}
    </span>
  );
}

function PhaseDescription({ phase }: { phase: string }) {
  const descriptions: Record<string, { label: string; description: string; icon: React.ReactNode }> = {
    'early-recovery': {
      label: 'Elpyminen',
      description: 'Talous elpyy taantumasta',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
    },
    'mid-expansion': {
      label: 'Kasvuvaihe',
      description: 'Vahva talouskasvu',
      icon: <Zap className="w-5 h-5 text-cyan-400" />,
    },
    'late-expansion': {
      label: 'Myöhäinen kasvu',
      description: 'Talous ylikuumenee',
      icon: <BarChart3 className="w-5 h-5 text-amber-400" />,
    },
    'recession': {
      label: 'Taantuma',
      description: 'Talous supistuu',
      icon: <Shield className="w-5 h-5 text-rose-400" />,
    },
  };

  const { label, description, icon } = descriptions[phase] || descriptions['mid-expansion'];

  return (
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="font-semibold text-[var(--foreground)]">{label}</p>
        <p className="text-xs text-[var(--foreground-muted)]">{description}</p>
      </div>
    </div>
  );
}

export default function CrownJewelsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [showMacroInfo, setShowMacroInfo] = useState(false);

  useEffect(() => {
    fetchCrownJewels();
  }, []);

  const fetchCrownJewels = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crown-jewels');
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error('Failed to fetch Crown Jewels:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJewels = data?.crownJewels.filter(j =>
    selectedTier === 'all' || j.tier === selectedTier
  ) || [];

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/screener"
                className="px-3 py-1.5 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                Screener
              </Link>
              <div className="flex-1 max-w-md">
                <SearchBar />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-amber-400" />
            <h1 className="font-heading text-3xl font-bold bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Crown Jewels
            </h1>
          </div>
          <p className="text-[var(--foreground-muted)]">
            Eliittiluokan sijoituskohteet - makro-adjusted ranking
          </p>
        </div>

        {/* Macro Environment Card */}
        {data && (
          <GlowCard glowColor="primary" className="p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[var(--primary)]" />
                Makroympäristö
              </h2>
              <button
                onClick={() => setShowMacroInfo(!showMacroInfo)}
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <Info className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Phase */}
              <div>
                <p className="text-xs text-[var(--foreground-muted)] mb-2">Taloussykli</p>
                <PhaseDescription phase={data.macroEnvironment.phase} />
              </div>

              {/* Key Indicators */}
              <div>
                <p className="text-xs text-[var(--foreground-muted)] mb-2">Fed Funds Rate</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{data.macroEnvironment.fedFundsRate}%</p>
              </div>

              <div>
                <p className="text-xs text-[var(--foreground-muted)] mb-2">Inflaatio (CPI)</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{data.macroEnvironment.inflation}%</p>
              </div>

              <div>
                <p className="text-xs text-[var(--foreground-muted)] mb-2">VIX</p>
                <p className="text-2xl font-bold text-[var(--foreground)]">{data.macroEnvironment.vix}</p>
              </div>
            </div>

            {/* Sector Rankings */}
            {showMacroInfo && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <h3 className="text-sm font-semibold text-[var(--foreground-secondary)] mb-3">Sektori-ranking (nykyinen ympäristö)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {data.sectorRankings.slice(0, 8).map((sector) => (
                    <div key={sector.sector} className="flex items-center justify-between p-2 rounded-lg bg-[var(--background-secondary)]">
                      <span className="text-sm text-[var(--foreground)]">{sector.sector}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-[var(--foreground-muted)]">{sector.score}</span>
                        <SectorOutlookBadge outlook={sector.outlook} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-[var(--foreground-muted)] mt-4">
              Päivitetty: {new Date(data.macroEnvironment.lastUpdated).toLocaleDateString('fi-FI')}
            </p>
          </GlowCard>
        )}

        {/* Summary Stats */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <GlowCard className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-400">{data.summary.crownJewelCount}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Crown Jewels</p>
            </GlowCard>
            <GlowCard className="p-4 text-center">
              <p className="text-3xl font-bold text-cyan-400">{data.summary.diamondCount}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Diamonds</p>
            </GlowCard>
            <GlowCard className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{data.summary.goldCount}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Gold</p>
            </GlowCard>
            <GlowCard className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-400">{data.summary.silverCount}</p>
              <p className="text-xs text-[var(--foreground-muted)]">Silver</p>
            </GlowCard>
            <GlowCard className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">+{data.summary.averageValueGap}%</p>
              <p className="text-xs text-[var(--foreground-muted)]">Avg Value Gap</p>
            </GlowCard>
          </div>
        )}

        {/* Tier Filter */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'crown-jewel', 'diamond', 'gold', 'silver'].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedTier === tier
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--card)] text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
              }`}
            >
              {tier === 'all' ? 'Kaikki' :
               tier === 'crown-jewel' ? '👑 Crown Jewels' :
               tier === 'diamond' ? '💎 Diamonds' :
               tier === 'gold' ? '🥇 Gold' : '🥈 Silver'}
            </button>
          ))}

          <button
            onClick={fetchCrownJewels}
            className="ml-auto p-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            title="Päivitä"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Crown Jewels Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJewels.map((jewel, index) => (
              <Link key={jewel.symbol} href={`/stock/${jewel.symbol}`}>
                <GlowCard
                  glowColor={jewel.tier === 'crown-jewel' ? 'primary' : jewel.tier === 'diamond' ? 'primary' : 'primary'}
                  className="p-5 h-full hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold text-[var(--foreground)]">{jewel.symbol}</span>
                        <span className="text-lg text-[var(--foreground-muted)]">#{index + 1}</span>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)] line-clamp-1">{jewel.name}</p>
                    </div>
                    <TierBadge tier={jewel.tier} />
                  </div>

                  {/* Scores */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <ScoreCircle score={jewel.adjustedScore} label="Adjusted" size="md" />
                      <div className="text-center">
                        <p className="text-sm text-[var(--foreground-muted)]">Base: {jewel.baseScore}</p>
                        <MacroBonusBadge bonus={jewel.macroBonus} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--foreground-muted)]">QM Score</p>
                      <p className="text-xl font-bold text-[var(--foreground)]">{jewel.qmScore}/8</p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3 py-3 border-t border-[var(--border)]">
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">Value Gap</p>
                      <p className="text-lg font-semibold text-emerald-400">+{jewel.valueGapPercent}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">5Y ROIC</p>
                      <p className="text-lg font-semibold text-[var(--foreground)]">{jewel.roic5yPercent}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">FCF Yield</p>
                      <p className="text-lg font-semibold text-[var(--foreground)]">{jewel.fcfYieldPercent}%</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <div>
                      <p className="text-xs text-[var(--foreground-muted)]">{jewel.sector}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">${jewel.marketCapB}B</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {jewel.hasBuybacks && (
                        <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded">Buybacks</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-[var(--foreground-muted)]" />
                    </div>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredJewels.length === 0 && (
          <div className="text-center py-20">
            <Crown className="w-16 h-16 mx-auto text-[var(--foreground-muted)] mb-4" />
            <p className="text-[var(--foreground-muted)]">Ei löytynyt Crown Jewels -osakkeita valituilla suodattimilla</p>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-12 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-3">Mikä on Crown Jewel?</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-[var(--foreground-secondary)]">
            <div>
              <p className="mb-3">
                <strong className="text-[var(--foreground)]">Crown Jewel</strong> on eliittiluokan sijoituskohde joka täyttää kaikki laatukriteerit:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Täydellinen QM-pisteet (8/8)</li>
                <li>Syvä aliarvostus (Value Gap &gt;30%)</li>
                <li>Kaikki kasvusignaalit positiiviset</li>
                <li>Aktiiviset takaisinostot</li>
              </ul>
            </div>
            <div>
              <p className="mb-3">
                <strong className="text-[var(--foreground)]">Makro-adjusted Score</strong> huomioi nykyisen talousympäristön:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Taloussykli (elpyminen/kasvu/taantuma)</li>
                <li>Likviditeettitilanne (QE/QT)</li>
                <li>Sektorin sopivuus nykyiseen ympäristöön</li>
                <li>Korkosensitiivisyys</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
