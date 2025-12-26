import { Suspense } from 'react';
import Link from 'next/link';
import { Card, Metric, Text, Badge, Grid } from '@tremor/react';
import { getFullStockData } from '@/lib/fmp';
import { calculateQMScore, calculateValuation, formatNumber } from '@/lib/qm-calculator';
import QMScoreCard from '@/components/QMScoreCard';
import ValuationGauge from '@/components/ValuationGauge';
import SearchBar from '@/components/SearchBar';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

async function StockData({ symbol }: { symbol: string }) {
  const data = await getFullStockData(symbol.toUpperCase());

  if (!data.quote || !data.profile) {
    return (
      <Card className="p-8 text-center">
        <Text className="text-xl text-red-600">Osaketta ei löytynyt: {symbol}</Text>
        <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
          Takaisin etusivulle
        </Link>
      </Card>
    );
  }

  const qmScore = calculateQMScore({
    quote: data.quote,
    income: data.income,
    balance: data.balance,
    cashFlow: data.cashFlow,
  });

  const valuation = calculateValuation(qmScore, data.quote.pe);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {data.profile.image && (
              <img
                src={data.profile.image}
                alt={data.profile.companyName}
                className="w-16 h-16 rounded-lg object-contain bg-white p-2 border"
              />
            )}
            <div>
              <div className="flex items-center gap-3">
                <Metric>{data.profile.companyName}</Metric>
                <Badge color="blue">{data.quote.symbol}</Badge>
              </div>
              <Text className="mt-1">
                {data.profile.sector} • {data.profile.industry}
              </Text>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">
              ${data.quote.price.toFixed(2)}
            </p>
            <p
              className={`text-lg font-medium ${
                data.quote.changesPercentage >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {data.quote.changesPercentage >= 0 ? '+' : ''}
              {data.quote.changesPercentage.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Key Stats */}
        <Grid numItems={2} numItemsSm={4} className="gap-4 mt-6">
          <Card decoration="left" decorationColor="blue" className="p-4">
            <Text>Markkina-arvo</Text>
            <Metric>{formatNumber(data.quote.marketCap)}</Metric>
          </Card>
          <Card decoration="left" decorationColor="purple" className="p-4">
            <Text>P/E</Text>
            <Metric>{data.quote.pe?.toFixed(2) || 'N/A'}</Metric>
          </Card>
          <Card decoration="left" decorationColor="emerald" className="p-4">
            <Text>EPS</Text>
            <Metric>${data.quote.eps?.toFixed(2) || 'N/A'}</Metric>
          </Card>
          <Card decoration="left" decorationColor="orange" className="p-4">
            <Text>52vk Vaihteluväli</Text>
            <Metric className="text-base">
              ${data.quote.yearLow?.toFixed(0)} - ${data.quote.yearHigh?.toFixed(0)}
            </Metric>
          </Card>
        </Grid>
      </Card>

      {/* QM Score and Valuation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QMScoreCard qmScore={qmScore} />
        <ValuationGauge valuation={valuation} />
      </div>

      {/* Company Description */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Yhtiön kuvaus</h2>
        <Text className="text-gray-700 leading-relaxed">
          {data.profile.description}
        </Text>
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          <span>CEO: {data.profile.ceo}</span>
          <span>•</span>
          <span>Työntekijät: {data.profile.fullTimeEmployees}</span>
          <span>•</span>
          <a
            href={data.profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {data.profile.website}
          </a>
        </div>
      </Card>
    </div>
  );
}

export default async function StockPage({ params }: PageProps) {
  const { symbol } = await params;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-blue-600">
            Quality Metrics
          </Link>
          <SearchBar />
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <Card className="p-8 text-center">
              <Text>Ladataan...</Text>
            </Card>
          }
        >
          <StockData symbol={symbol} />
        </Suspense>
      </main>
    </div>
  );
}
