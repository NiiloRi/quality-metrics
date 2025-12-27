'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Filter, TrendingUp, TrendingDown, Minus, ArrowUpDown, Play, Loader2, Globe, Flag, AlertTriangle, Gem } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import Logo from '@/components/Logo';
import GlowCard from '@/components/GlowCard';

type Market = 'US' | 'Europe' | 'all';
type Rating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';

interface Stock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market: 'US' | 'Europe';
  data_source: 'FMP' | 'Yahoo';
  market_cap: number;
  price: number;
  pe_ratio: number | null;
  qm_score: number;
  fair_pe: number;
  value_gap: number | null;
  valuation_status: string;
  rating: Rating | null;
  rating_score: number | null;
  is_hidden_gem: number;
  updated_at: string;
}

interface MarketInfo {
  isScanning: boolean;
  stockCount: number;
  totalStocks: number;
  lastUpdate: string | null;
}

interface ScannerStatus {
  markets: {
    US: MarketInfo;
    Europe: MarketInfo;
  };
  totalStockCount: number;
}

function formatNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
}

function ValuationBadge({ status, gap }: { status: string; gap: number | null }) {
  const config = {
    undervalued: { icon: TrendingUp, bg: 'bg-emerald-500/15', text: 'text-[var(--success-light)]', border: 'border-emerald-500/30' },
    fair: { icon: Minus, bg: 'bg-amber-500/15', text: 'text-[var(--primary-light)]', border: 'border-amber-500/30' },
    overvalued: { icon: TrendingDown, bg: 'bg-rose-500/15', text: 'text-[var(--danger-light)]', border: 'border-rose-500/30' },
    unknown: { icon: Minus, bg: 'bg-[var(--background-secondary)]', text: 'text-[var(--foreground-muted)]', border: 'border-[var(--border)]' },
  }[status] || { icon: Minus, bg: 'bg-[var(--background-secondary)]', text: 'text-[var(--foreground-muted)]', border: 'border-[var(--border)]' };

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} ${config.border} border`}>
      <Icon className="w-3 h-3" />
      {gap !== null ? `${gap > 0 ? '+' : ''}${gap.toFixed(0)}%` : 'N/A'}
    </div>
  );
}

function ScoreBar({ score, max = 8 }: { score: number; max?: number }) {
  const percentage = (score / max) * 100;
  const color = score >= 7 ? 'bg-emerald-500' : score >= 5 ? 'bg-amber-500' : score >= 3 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-[var(--background-secondary)] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm font-bold text-[var(--foreground)] font-mono w-6">{score}</span>
    </div>
  );
}

function MarketBadge({ market, dataSource }: { market: 'US' | 'Europe'; dataSource?: 'FMP' | 'Yahoo' }) {
  if (market === 'US') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded">
        US
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-medium rounded">
        EU
      </span>
      {dataSource === 'Yahoo' && (
        <span className="inline-flex items-center px-1 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-medium rounded" title="Data from Yahoo Finance">
          Y
        </span>
      )}
    </div>
  );
}

function RatingBadge({ rating, score }: { rating: Rating | null; score: number | null }) {
  if (!rating) return <span className="text-xs text-[var(--foreground-muted)]">N/A</span>;

  const config: Record<Rating, { bg: string; text: string; border: string }> = {
    'Strong Buy': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
    'Buy': { bg: 'bg-green-500/20', text: 'text-green-300', border: 'border-green-500/40' },
    'Hold': { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40' },
    'Sell': { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/40' },
  };

  const { bg, text, border } = config[rating];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text} ${border} border`}>
      <span>{rating}</span>
      {score !== null && <span className="opacity-75">({score})</span>}
    </div>
  );
}

function HiddenGemBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
      <Gem className="w-3 h-3" />
      Hidden Gem
    </span>
  );
}

export default function ScreenerPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(null);
  const [scanningMarkets, setScanningMarkets] = useState<{ US: boolean; Europe: boolean }>({ US: false, Europe: false });
  const [scanProgress, setScanProgress] = useState<{ US: number; Europe: number }>({ US: 0, Europe: 0 });

  // Filters
  const [selectedMarket, setSelectedMarket] = useState<Market>('all');
  const [minScore, setMinScore] = useState(0);
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedValuation, setSelectedValuation] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [showHiddenGemsOnly, setShowHiddenGemsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('rating_score');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        minScore: String(minScore),
        sector: selectedSector,
        market: selectedMarket,
        valuation: selectedValuation,
        rating: selectedRating,
        hiddenGemsOnly: showHiddenGemsOnly ? 'true' : 'false',
        sortBy,
        sortOrder,
        limit: '200',
      });

      const res = await fetch(`/api/stocks?${params}`);
      const data = await res.json();
      setStocks(data.stocks || []);
      setSectors(data.sectors || []);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  }, [minScore, selectedSector, selectedMarket, selectedValuation, selectedRating, showHiddenGemsOnly, sortBy, sortOrder]);

  const fetchScannerStatus = async () => {
    try {
      const res = await fetch('/api/scanner');
      const data = await res.json();
      setScannerStatus(data);
    } catch (error) {
      console.error('Failed to fetch scanner status:', error);
    }
  };

  const startScan = async (market: 'US' | 'Europe') => {
    setScanningMarkets(prev => ({ ...prev, [market]: true }));
    setScanProgress(prev => ({ ...prev, [market]: 0 }));
    await runScanBatch(market, 0);
  };

  const runScanBatch = async (market: 'US' | 'Europe', startIndex: number) => {
    try {
      const batchSize = market === 'US' ? 25 : 20;

      const res = await fetch('/api/scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'scan', market, batchSize, startIndex }),
      });

      const data = await res.json();

      if (data.success) {
        setScanProgress(prev => ({ ...prev, [market]: data.progress.percentage }));
        await fetchScannerStatus();

        if (data.hasMore) {
          setTimeout(() => runScanBatch(market, data.nextIndex), 500);
        } else {
          setScanningMarkets(prev => ({ ...prev, [market]: false }));
          fetchStocks();
        }
      } else {
        setScanningMarkets(prev => ({ ...prev, [market]: false }));
      }
    } catch (error) {
      console.error('Scan error:', error);
      setScanningMarkets(prev => ({ ...prev, [market]: false }));
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchScannerStatus();
  }, [fetchStocks]);

  const usInfo = scannerStatus?.markets.US;
  const euInfo = scannerStatus?.markets.Europe;

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
                href="/crown-jewels"
                className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-full hover:from-amber-600 hover:to-yellow-600 transition-colors"
              >
                👑 Crown Jewels
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
          <h1 className="font-heading text-2xl font-bold text-[var(--foreground)]">Stock Screener</h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {scannerStatus?.totalStockCount || 0} stocks analyzed
          </p>
        </div>

        {/* Market Tabs & Scan Buttons */}
        <GlowCard className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Market Tabs */}
            <div className="tab-nav">
              <button
                onClick={() => setSelectedMarket('all')}
                className={`tab-nav-item ${selectedMarket === 'all' ? 'active' : ''}`}
              >
                <Globe className="w-4 h-4 inline mr-1.5" />
                All Markets
              </button>
              <button
                onClick={() => setSelectedMarket('US')}
                className={`tab-nav-item ${selectedMarket === 'US' ? 'active' : ''}`}
              >
                <Flag className="w-4 h-4 inline mr-1.5" />
                US ({usInfo?.stockCount || 0})
              </button>
              <button
                onClick={() => setSelectedMarket('Europe')}
                className={`tab-nav-item ${selectedMarket === 'Europe' ? 'active' : ''}`}
              >
                <Globe className="w-4 h-4 inline mr-1.5" />
                Europe ({euInfo?.stockCount || 0})
              </button>
            </div>

            {/* Scan Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => startScan('US')}
                disabled={scanningMarkets.US}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
              >
                {scanningMarkets.US ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {scanProgress.US}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Scan US
                  </>
                )}
              </button>
              <button
                onClick={() => startScan('Europe')}
                disabled={scanningMarkets.Europe}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
              >
                {scanningMarkets.Europe ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {scanProgress.Europe}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Scan Europe
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border)]">
            <div className="text-sm">
              <span className="text-[var(--foreground-muted)]">US: </span>
              <span className="font-medium text-[var(--foreground)]">{usInfo?.stockCount || 0}/{usInfo?.totalStocks || 0}</span>
              {usInfo?.lastUpdate && (
                <span className="text-[var(--foreground-muted)] ml-2">
                  Updated: {new Date(usInfo.lastUpdate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-sm">
              <span className="text-[var(--foreground-muted)]">Europe: </span>
              <span className="font-medium text-[var(--foreground)]">{euInfo?.stockCount || 0}/{euInfo?.totalStocks || 0}</span>
              {euInfo?.lastUpdate && (
                <span className="text-[var(--foreground-muted)] ml-2">
                  Updated: {new Date(euInfo.lastUpdate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </GlowCard>

        {/* Europe Data Warning */}
        {(selectedMarket === 'Europe' || selectedMarket === 'all') && (euInfo?.stockCount || 0) > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-6">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                <strong>Euroopan data:</strong> Yahoo Finance (ilmainen) - tiedot voivat olla epätarkkoja tai viivästettyjä
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <GlowCard className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[var(--foreground-muted)]" />
              <span className="text-sm font-medium text-[var(--foreground-secondary)]">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--foreground-secondary)]">Min Score:</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
              >
                <option value="0">All</option>
                <option value="5">5+</option>
                <option value="6">6+</option>
                <option value="7">7+</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--foreground-secondary)]">Sector:</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
              >
                <option value="all">All Sectors</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--foreground-secondary)]">Valuation:</label>
              <select
                value={selectedValuation}
                onChange={(e) => setSelectedValuation(e.target.value)}
              >
                <option value="all">All</option>
                <option value="undervalued">Undervalued</option>
                <option value="fair">Fair Value</option>
                <option value="overvalued">Overvalued</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--foreground-secondary)]">Rating:</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Strong Buy">Strong Buy</option>
                <option value="Buy">Buy</option>
                <option value="Hold">Hold</option>
                <option value="Sell">Sell</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHiddenGemsOnly}
                  onChange={(e) => setShowHiddenGemsOnly(e.target.checked)}
                  className="w-4 h-4 text-[var(--primary)] border-[var(--border)] rounded focus:ring-[var(--primary)]"
                />
                <span className="text-sm text-[var(--foreground-secondary)] flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-purple-400" />
                  Hidden Gems
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--foreground-secondary)]">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="rating_score">Rating Score</option>
                <option value="qm_score">QM Score</option>
                <option value="value_gap">Value Gap</option>
                <option value="market_cap">Market Cap</option>
                <option value="pe_ratio">P/E Ratio</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 hover:bg-[var(--background-secondary)] rounded"
              >
                <ArrowUpDown className="w-4 h-4 text-[var(--foreground-muted)]" />
              </button>
            </div>
          </div>
        </GlowCard>

        {/* Stock Table */}
        <div className="card-professional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Market Cap</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">QM Score</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--foreground-muted)]" />
                      <p className="text-[var(--foreground-muted)] mt-2">Loading stocks...</p>
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-[var(--foreground-muted)]">No stocks found. Click "Scan US" or "Scan Europe" to fetch data.</p>
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => (
                    <tr key={stock.symbol} className="table-row">
                      <td className="px-4 py-3">
                        <Link href={`/stock/${stock.symbol}`} className="group">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">{stock.symbol}</p>
                              <p className="text-xs text-[var(--foreground-muted)] truncate max-w-[200px]">{stock.name}</p>
                            </div>
                            {stock.is_hidden_gem === 1 && <HiddenGemBadge />}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <MarketBadge market={stock.market} dataSource={stock.data_source} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[var(--foreground-secondary)]">{stock.sector}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-[var(--foreground)] font-mono">${stock.price?.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-[var(--foreground-secondary)] font-mono">{formatNumber(stock.market_cap)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <ScoreBar score={stock.qm_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <RatingBadge rating={stock.rating} score={stock.rating_score} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ValuationBadge status={stock.valuation_status} gap={stock.value_gap} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results count */}
        {stocks.length > 0 && (
          <p className="text-sm text-[var(--foreground-muted)] mt-4 text-center">
            Showing {stocks.length} stocks
          </p>
        )}
      </main>
    </div>
  );
}
