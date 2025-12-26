import { NextResponse } from 'next/server';
import { getAllStocks, getSectors, getStockCount, getLastUpdateTime, getMarkets, type StockRow, type Market, type Rating } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minScore = parseInt(searchParams.get('minScore') || '0');
  const sector = searchParams.get('sector');
  const market = searchParams.get('market') as Market | 'all' | null;
  const valuation = searchParams.get('valuation'); // undervalued, fair, overvalued
  const rating = searchParams.get('rating') as Rating | 'all' | null;
  const hiddenGemsOnly = searchParams.get('hiddenGemsOnly') === 'true';
  const sortBy = searchParams.get('sortBy') || 'rating_score';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let stocks = getAllStocks();

    // Apply filters
    if (minScore > 0) {
      stocks = stocks.filter(s => s.qm_score >= minScore);
    }

    if (sector && sector !== 'all') {
      stocks = stocks.filter(s => s.sector === sector);
    }

    if (market && market !== 'all') {
      stocks = stocks.filter(s => s.market === market);
    }

    if (valuation && valuation !== 'all') {
      stocks = stocks.filter(s => s.valuation_status === valuation);
    }

    if (rating && rating !== 'all') {
      stocks = stocks.filter(s => s.rating === rating);
    }

    if (hiddenGemsOnly) {
      stocks = stocks.filter(s => s.is_hidden_gem === 1);
    }

    // Sort
    stocks.sort((a, b) => {
      let aVal: number | string | null = 0;
      let bVal: number | string | null = 0;

      switch (sortBy) {
        case 'rating_score':
          aVal = a.rating_score ?? -Infinity;
          bVal = b.rating_score ?? -Infinity;
          break;
        case 'qm_score':
          aVal = a.qm_score;
          bVal = b.qm_score;
          break;
        case 'value_gap':
          aVal = a.value_gap ?? -Infinity;
          bVal = b.value_gap ?? -Infinity;
          break;
        case 'market_cap':
          aVal = a.market_cap;
          bVal = b.market_cap;
          break;
        case 'pe_ratio':
          aVal = a.pe_ratio ?? Infinity;
          bVal = b.pe_ratio ?? Infinity;
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        default:
          aVal = a.rating_score ?? a.qm_score;
          bVal = b.rating_score ?? b.qm_score;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    // Limit
    stocks = stocks.slice(0, limit);

    return NextResponse.json({
      stocks,
      totalCount: getStockCount(),
      filteredCount: stocks.length,
      sectors: getSectors(),
      markets: getMarkets(),
      lastUpdate: getLastUpdateTime(),
    });
  } catch (error) {
    console.error('Stocks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
