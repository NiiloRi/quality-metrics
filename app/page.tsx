import { Card, Title, Text, Grid, Badge } from '@tremor/react';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

// Example stocks for quick access
const popularStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Quality Metrics
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Analysoi osakkeiden laatua ja arvostusta QM-asteikon avulla.
            Löydä aliarvostetut laatuyhtiöt.
          </p>
        </div>

        {/* Search */}
        <div className="flex justify-center mb-16">
          <SearchBar />
        </div>

        {/* Popular Stocks */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Suositut osakkeet
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {popularStocks.map((stock) => (
              <Link
                key={stock.symbol}
                href={`/stock/${stock.symbol}`}
                className="px-4 py-2 bg-white rounded-full border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all"
              >
                <span className="font-bold text-blue-600">{stock.symbol}</span>
                <span className="text-gray-500 ml-2">{stock.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Features */}
        <Grid numItems={1} numItemsMd={3} className="gap-6">
          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">📊</div>
            <Title>QM-asteikko</Title>
            <Text className="mt-2">
              8 laatumetriikkaa jotka kertovat yhtiön fundamenteista:
              kasvu, kannattavuus, velkaantuneisuus.
            </Text>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">💰</div>
            <Title>Arvostusanalyysi</Title>
            <Text className="mt-2">
              Näe onko osake ali- vai yliarvostettu laatuunsa nähden.
              Fair P/E lasketaan QM-pisteiden perusteella.
            </Text>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <Title>Screener</Title>
            <Text className="mt-2">
              Suodata osakkeet laatupisteiden, sektorin ja arvostuksen
              mukaan. Löydä parhaat kohteet.
            </Text>
            <Link href="/screener" className="text-blue-600 hover:underline mt-2 inline-block">
              Avaa screener →
            </Link>
          </Card>
        </Grid>

        {/* QM Pillars Explanation */}
        <Card className="mt-12 p-8">
          <Title className="text-center mb-6">QM-asteikon 8 pilaria</Title>
          <Grid numItems={2} numItemsMd={4} className="gap-4">
            {[
              { name: '5v P/E', desc: '< 22.5', icon: '📈' },
              { name: '5v ROIC', desc: '> 9%', icon: '💹' },
              { name: 'Osakkeet', desc: 'Laskeva', icon: '🔄' },
              { name: 'FCF kasvu', desc: 'Kasvava', icon: '💵' },
              { name: 'Tulos kasvu', desc: 'Kasvava', icon: '📊' },
              { name: 'Liikevaihto', desc: 'Kasvava', icon: '🚀' },
              { name: 'Velka/FCF', desc: '< 5x', icon: '⚖️' },
              { name: '5v P/FCF', desc: '< 22.5', icon: '💰' },
            ].map((pillar) => (
              <div
                key={pillar.name}
                className="p-4 bg-gray-50 rounded-lg text-center"
              >
                <div className="text-2xl mb-2">{pillar.icon}</div>
                <p className="font-bold text-gray-900">{pillar.name}</p>
                <Badge color="blue" className="mt-1">
                  {pillar.desc}
                </Badge>
              </div>
            ))}
          </Grid>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 text-center text-gray-500">
        <p>Quality Metrics © 2024 • Data: Financial Modeling Prep</p>
      </footer>
    </div>
  );
}
