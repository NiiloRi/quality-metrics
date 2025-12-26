import Link from 'next/link';
import { BarChart3, TrendingUp, Filter, CheckCircle2, ArrowRight, Zap, Shield, Target } from 'lucide-react';
import SearchBar from '@/components/SearchBar';

const popularStocks = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta' },
  { symbol: 'BRK.B', name: 'Berkshire' },
  { symbol: 'JNJ', name: 'J&J' },
  { symbol: 'V', name: 'Visa' },
  { symbol: 'JPM', name: 'JPMorgan' },
];

const pillars = [
  { name: '5Y P/E', threshold: '< 22.5', description: 'Price to 5-year cumulative earnings' },
  { name: '5Y ROIC', threshold: '> 9%', description: 'Return on invested capital' },
  { name: 'Share Count', threshold: 'Decreasing', description: 'Shares outstanding trend' },
  { name: 'FCF Growth', threshold: 'Growing', description: 'Free cash flow trajectory' },
  { name: 'Earnings Growth', threshold: 'Growing', description: 'Net income trajectory' },
  { name: 'Revenue Growth', threshold: 'Growing', description: 'Top line trajectory' },
  { name: 'Debt/FCF', threshold: '< 5x', description: 'Leverage vs cash generation' },
  { name: '5Y P/FCF', threshold: '< 22.5', description: 'Price to 5-year cumulative FCF' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-gray-900">Quality Metrics</span>
            </Link>
            <Link
              href="/screener"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Screener
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
              Find undervalued
              <span className="text-[var(--primary)]"> quality stocks</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Analyze any stock using our comprehensive QM scoring system.
              Discover companies trading below their intrinsic value.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mt-10">
            <SearchBar />
          </div>

          {/* Popular Stocks */}
          <div className="mt-8">
            <p className="text-center text-sm text-gray-500 mb-4">Popular searches</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularStocks.map((stock) => (
                <Link
                  key={stock.symbol}
                  href={`/stock/${stock.symbol}`}
                  className="group flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 hover:border-[var(--primary)] hover:shadow-md transition-all"
                >
                  <span className="font-semibold text-[var(--primary)]">{stock.symbol}</span>
                  <span className="text-gray-500 text-sm">{stock.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Data-driven stock analysis
            </h2>
            <p className="mt-3 text-gray-600">
              Make informed investment decisions with comprehensive fundamental analysis
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-professional p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Quality Score</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                8 fundamental metrics that reveal a company's financial health:
                profitability, growth, and balance sheet strength.
              </p>
            </div>

            <div className="card-professional p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Valuation Analysis</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                See if a stock is undervalued or overvalued relative to its quality.
                Fair P/E calculated based on fundamental strength.
              </p>
            </div>

            <div className="card-professional p-6">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Stock Screener</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Filter stocks by quality score, valuation, sector, and market cap.
                Find the best opportunities in the market.
              </p>
              <Link
                href="/screener"
                className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-[var(--primary)] hover:underline"
              >
                Open Screener
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* QM Pillars */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Quality Metrics
            </h2>
            <p className="mt-3 text-gray-600">
              Based on proven value investing principles
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {pillars.map((pillar, index) => (
              <div
                key={pillar.name}
                className="card-professional p-4 text-center group hover:shadow-lg"
              >
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[var(--primary)] group-hover:text-white transition-colors">
                  <span className="font-bold text-sm">{index + 1}</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{pillar.name}</h4>
                <span className="inline-block mt-2 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                  {pillar.threshold}
                </span>
                <p className="mt-2 text-xs text-gray-500">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              How valuation works
            </h2>
            <p className="mt-3 text-gray-600">
              Quality determines fair value
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="card-professional p-6 sm:p-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Calculate Quality Score</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Each quality metric is evaluated against proven thresholds. Higher score = higher quality.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Determine Fair P/E</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Higher quality = higher justified P/E. Quality score directly influences fair valuation.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Compare to Market Price</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      If Current P/E {"<"} Fair P/E = Undervalued. The bigger the gap, the better the opportunity.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                <p className="text-center text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">Example: </span>
                  A high-quality stock has Fair P/E of 22.5.
                  If trading at P/E 18, it's ~20% undervalued.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">Quality Metrics</span>
            </div>
            <p className="text-sm text-gray-500">
              Data provided by Financial Modeling Prep
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
