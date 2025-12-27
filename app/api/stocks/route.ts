import { NextResponse } from 'next/server';
import { getAllStocks, getSectors, getStockCount, getLastUpdateTime, getMarkets, type StockRow, type Market, type Rating } from '@/lib/db';
import { convertArrayToDemo, isDemoMode } from '@/lib/demo-data';
import { InvestmentTimeframe, TIMEFRAME_WEIGHTS, DEFAULT_TIMEFRAME } from '@/lib/timeframe-scoring';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const minScore = parseInt(searchParams.get('minScore') || '0');
  const sector = searchParams.get('sector');
  const market = searchParams.get('market') as Market | 'all' | null;
  const timeframe = (searchParams.get('timeframe') as InvestmentTimeframe) || DEFAULT_TIMEFRAME;
  const valuation = searchParams.get('valuation'); // undervalued, fair, overvalued
  const rating = searchParams.get('rating') as Rating | 'all' | null;
  const hiddenGemsOnly = searchParams.get('hiddenGemsOnly') === 'true';
  const sortBy = searchParams.get('sortBy') || 'rating_score';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const limit = parseInt(searchParams.get('limit') || '100');

  try {
    let stocks = await getAllStocks();

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

    // Apply timeframe-specific thresholds
    const timeframeThresholds = TIMEFRAME_WEIGHTS[timeframe].thresholds;
    stocks = stocks.filter(s => {
      // Minimum QM score for timeframe
      if (s.qm_score < timeframeThresholds.minQmScore) return false;

      // Minimum value gap for timeframe (skip if valuation filter already applied)
      if (valuation === 'all' && (s.value_gap ?? -100) < timeframeThresholds.minValueGap) return false;

      // Maximum P/E ratio for timeframe
      if (s.pe_ratio && s.pe_ratio > timeframeThresholds.maxPE) return false;

      return true;
    });

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

    const [totalCount, sectors, markets, lastUpdate] = await Promise.all([
      getStockCount(),
      getSectors(),
      getMarkets(),
      getLastUpdateTime(),
    ]);

    // Convert to demo data if demo mode is enabled
    const outputStocks = convertArrayToDemo(stocks);

    return NextResponse.json({
      stocks: outputStocks,
      totalCount,
      filteredCount: stocks.length,
      sectors,
      markets,
      lastUpdate,
      demoMode: isDemoMode(),
    });
  } catch (error) {
    console.error('Stocks API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
