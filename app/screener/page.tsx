'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BarChart3, Filter, TrendingUp, TrendingDown, Minus, ArrowUpDown, Play, Loader2, Globe, Flag, AlertTriangle, Gem } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

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
    undervalued: { icon: TrendingUp, bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    fair: { icon: Minus, bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    overvalued: { icon: TrendingDown, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    unknown: { icon: Minus, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
  }[status] || { icon: Minus, bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };

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
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-sm font-bold text-gray-900 w-6">{score}</span>
    </div>
  );
}

function MarketBadge({ market, dataSource }: { market: 'US' | 'Europe'; dataSource?: 'FMP' | 'Yahoo' }) {
  if (market === 'US') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
        US
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded">
        EU
      </span>
      {dataSource === 'Yahoo' && (
        <span className="inline-flex items-center px-1 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-medium rounded" title="Data from Yahoo Finance">
          Y
        </span>
      )}
    </div>
  );
}

function RatingBadge({ rating, score }: { rating: Rating | null; score: number | null }) {
  if (!rating) return <span className="text-xs text-gray-400">N/A</span>;

  const config: Record<Rating, { bg: string; text: string; border: string }> = {
    'Strong Buy': { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    'Buy': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    'Hold': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
    'Sell': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
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
      // Larger batches for faster scanning
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
          // Continue with next batch - shorter delay since parallel processing handles rate limiting
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
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-900 hover:text-[var(--primary)] transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg hidden sm:inline">Quality Metrics</span>
            </Link>
            <div className="flex-1 max-w-md">
              <SearchBar />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Stock Screener</h1>
          <p className="text-gray-500 text-sm mt-1">
            {scannerStatus?.totalStockCount || 0} stocks analyzed
          </p>
        </div>

        {/* Market Tabs & Scan Buttons */}
        <div className="card-professional p-4 mb-6">
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
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
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
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="text-sm">
              <span className="text-gray-500">US: </span>
              <span className="font-medium">{usInfo?.stockCount || 0}/{usInfo?.totalStocks || 0}</span>
              {usInfo?.lastUpdate && (
                <span className="text-gray-400 ml-2">
                  Updated: {new Date(usInfo.lastUpdate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="text-sm">
              <span className="text-gray-500">Europe: </span>
              <span className="font-medium">{euInfo?.stockCount || 0}/{euInfo?.totalStocks || 0}</span>
              {euInfo?.lastUpdate && (
                <span className="text-gray-400 ml-2">
                  Updated: {new Date(euInfo.lastUpdate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Europe Data Warning */}
        {(selectedMarket === 'Europe' || selectedMarket === 'all') && (euInfo?.stockCount || 0) > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                <strong>Euroopan data:</strong> Yahoo Finance (ilmainen) - tiedot voivat olla epätarkkoja tai viivästettyjä
              </span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card-professional p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Min Score:</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0">All</option>
                <option value="5">5+</option>
                <option value="6">6+</option>
                <option value="7">7+</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sector:</label>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sectors</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Valuation:</label>
              <select
                value={selectedValuation}
                onChange={(e) => setSelectedValuation(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="undervalued">Undervalued</option>
                <option value="fair">Fair Value</option>
                <option value="overvalued">Overvalued</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rating:</label>
              <select
                value={selectedRating}
                onChange={(e) => setSelectedRating(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Gem className="w-3.5 h-3.5 text-purple-500" />
                  Hidden Gems
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="rating_score">Rating Score</option>
                <option value="qm_score">QM Score</option>
                <option value="value_gap">Value Gap</option>
                <option value="market_cap">Market Cap</option>
                <option value="pe_ratio">P/E Ratio</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="card-professional overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sector</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Market Cap</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">QM Score</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                      <p className="text-gray-500 mt-2">Loading stocks...</p>
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <p className="text-gray-500">No stocks found. Click "Scan US" or "Scan Europe" to fetch data.</p>
                    </td>
                  </tr>
                ) : (
                  stocks.map((stock) => (
                    <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/stock/${stock.symbol}`} className="group">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-semibold text-gray-900 group-hover:text-[var(--primary)]">{stock.symbol}</p>
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{stock.name}</p>
                            </div>
                            {stock.is_hidden_gem === 1 && <HiddenGemBadge />}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <MarketBadge market={stock.market} dataSource={stock.data_source} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{stock.sector}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">${stock.price?.toFixed(2)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-gray-600">{formatNumber(stock.market_cap)}</span>
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
          <p className="text-sm text-gray-500 mt-4 text-center">
            Showing {stocks.length} stocks
          </p>
        )}
      </main>
    </div>
  );
}
