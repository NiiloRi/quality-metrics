import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Building2, Users, Globe, TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
import { getFullStockData } from '@/lib/fmp';
import { calculateQMScore, calculateValuation, formatNumber } from '@/lib/qm-calculator';
import QMScoreCard from '@/components/QMScoreCard';
import ValuationGauge from '@/components/ValuationGauge';
import SearchBar from '@/components/SearchBar';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card-professional p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-xl" />
          <div className="flex-1">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-32" />
          </div>
          <div className="text-right">
            <div className="h-10 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-professional p-6 h-96 bg-gray-100" />
        <div className="card-professional p-6 h-96 bg-gray-100" />
      </div>
    </div>
  );
}

async function StockData({ symbol }: { symbol: string }) {
  const data = await getFullStockData(symbol.toUpperCase());

  if (!data.quote || !data.profile) {
    return (
      <div className="card-professional p-12 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <TrendingDown className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Stock not found</h2>
        <p className="text-gray-500 mb-6">We couldn't find data for ticker "{symbol}"</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to search
        </Link>
      </div>
    );
  }

  const qmScore = calculateQMScore({
    quote: data.quote,
    income: data.income,
    balance: data.balance,
    cashFlow: data.cashFlow,
  });

  // Calculate P/E from market cap and latest net income (more reliable)
  const latestNetIncome = data.income[0]?.netIncome || 0;
  const calculatedPE = latestNetIncome > 0
    ? data.quote.marketCap / latestNetIncome
    : null;

  const valuation = calculateValuation(qmScore, calculatedPE);

  const priceChange = data.quote.changesPercentage ?? 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="space-y-6">
      {/* Stock Header */}
      <div className="card-professional p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-4">
            {data.profile.image && (
              <img
                src={data.profile.image}
                alt={data.profile.companyName}
                className="w-16 h-16 rounded-xl object-contain bg-white p-2 border border-gray-200"
              />
            )}
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{data.profile.companyName}</h1>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                  {data.quote.symbol}
                </span>
              </div>
              <p className="text-gray-500 mt-1">
                {data.profile.sector} • {data.profile.industry}
              </p>
            </div>
          </div>
          <div className="text-left md:text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${data.quote.price?.toFixed(2) ?? 'N/A'}
            </p>
            <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="text-lg font-semibold">
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Market Cap</p>
              <p className="text-sm font-bold text-gray-900">{formatNumber(data.quote.marketCap)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">P/E Ratio</p>
              <p className="text-sm font-bold text-gray-900">{calculatedPE?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">EPS (TTM)</p>
              <p className="text-sm font-bold text-gray-900">${data.quote.eps?.toFixed(2) || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">52W Range</p>
              <p className="text-sm font-bold text-gray-900">
                ${data.quote.yearLow?.toFixed(0) ?? '?'} - ${data.quote.yearHigh?.toFixed(0) ?? '?'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* QM Score and Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QMScoreCard qmScore={qmScore} />
        <ValuationGauge valuation={valuation} />
      </div>

      {/* Company Info */}
      <div className="card-professional p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">About {data.profile.companyName}</h2>
        <p className="text-gray-600 leading-relaxed text-sm">
          {data.profile.description}
        </p>
        <div className="flex flex-wrap items-center gap-6 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-500">
          {data.profile.ceo && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>CEO: {data.profile.ceo}</span>
            </div>
          )}
          {data.profile.fullTimeEmployees && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{Number(data.profile.fullTimeEmployees).toLocaleString()} employees</span>
            </div>
          )}
          {data.profile.website && (
            <a
              href={data.profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[var(--primary)] hover:underline"
            >
              <Globe className="w-4 h-4" />
              <span>Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function StockPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
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

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Suspense fallback={<LoadingSkeleton />}>
          <StockData symbol={symbol} />
        </Suspense>
      </main>
    </div>
  );
}
