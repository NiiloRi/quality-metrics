import { NextResponse } from 'next/server';
import { getStockData } from '@/lib/stock-data';
import { calculateQMScore, calculateValuation, calculateRating } from '@/lib/qm-calculator';
import { upsertStock, getStockCount, getLastUpdateTime, getStockCountByMarket, getLastUpdateTimeByMarket, type Market } from '@/lib/db';
import { getStocksForMarket, getStockCount as getListStockCount, US_STOCKS, EUROPE_STOCKS } from '@/lib/stock-lists';

// Process a single stock and return result
async function processStock(symbol: string, market: Market): Promise<{ success: boolean; symbol: string }> {
  try {
    const data = await getStockData(symbol, market);

    if (!data.quote || !data.profile) {
      return { success: false, symbol };
    }

    const qmScore = calculateQMScore({
      quote: data.quote,
      income: data.income,
      balance: data.balance,
      cashFlow: data.cashFlow,
    });

    const latestNetIncome = data.income[0]?.netIncome || 0;
    const calculatedPE = latestNetIncome > 0
      ? data.quote.marketCap / latestNetIncome
      : null;

    const valuation = calculateValuation(qmScore, calculatedPE);

    // Calculate rating using all available metrics
    const ratingAnalysis = calculateRating({
      qmScore,
      valuation,
      quote: data.quote,
      income: data.income,
      cashFlow: data.cashFlow,
      metrics: data.metrics?.[0], // Latest metrics
    });

    await upsertStock({
      symbol,
      name: data.profile.companyName,
      sector: data.profile.sector,
      industry: data.profile.industry,
      market,
      data_source: data.dataSource,
      market_cap: data.quote.marketCap,
      price: data.quote.price,
      pe_ratio: calculatedPE,
      qm_score: qmScore.totalScore,
      fair_pe: valuation.fairPE,
      value_gap: valuation.valueGap,
      valuation_status: valuation.status,
      rating: ratingAnalysis.rating,
      rating_score: ratingAnalysis.score,
      is_hidden_gem: ratingAnalysis.isHiddenGem ? 1 : 0,
      data_json: JSON.stringify({
        profile: data.profile,
        qmScore,
        valuation,
        ratingAnalysis,
        dataSource: data.dataSource,
      }),
    });

    return { success: true, symbol };
  } catch (error) {
    console.error(`Error scanning ${symbol}:`, error);
    return { success: false, symbol };
  }
}

// Process stocks in parallel with controlled concurrency
async function processBatchParallel(
  symbols: string[],
  market: Market,
  concurrency: number,
  onProgress: (symbol: string) => void
): Promise<{ success: string[]; failed: string[] }> {
  const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

  // Process in chunks of 'concurrency' size
  for (let i = 0; i < symbols.length; i += concurrency) {
    const chunk = symbols.slice(i, i + concurrency);

    // Process chunk in parallel
    const chunkResults = await Promise.all(
      chunk.map(async (symbol) => {
        onProgress(symbol);
        return processStock(symbol, market);
      })
    );

    // Collect results
    for (const result of chunkResults) {
      if (result.success) {
        results.success.push(result.symbol);
      } else {
        results.failed.push(result.symbol);
      }
    }

    // Small delay between chunks to respect rate limits
    // FMP: 300 calls/min = 5 calls/sec, each stock = 6 calls
    // With concurrency 5: 30 calls per chunk, wait 6 seconds
    if (i + concurrency < symbols.length) {
      const delayMs = market === 'US' ? 400 : 200; // Shorter delay for Yahoo
      await new Promise(resolve => setTimeout(resolve, delayMs * concurrency));
    }
  }

  return results;
}

// Scanner status per market
const scannerState: Record<Market, {
  isScanning: boolean;
  progress: { current: number; total: number; lastSymbol: string; errors: number };
}> = {
  US: { isScanning: false, progress: { current: 0, total: US_STOCKS.length, lastSymbol: '', errors: 0 } },
  Europe: { isScanning: false, progress: { current: 0, total: EUROPE_STOCKS.length, lastSymbol: '', errors: 0 } },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const market = (searchParams.get('market') as Market) || 'US';

  const [stockCount, totalStockCount, lastUpdate, usStockCount, usLastUpdate, europeStockCount, europeLastUpdate] = await Promise.all([
    getStockCountByMarket(market),
    getStockCount(),
    getLastUpdateTimeByMarket(market),
    getStockCountByMarket('US'),
    getLastUpdateTimeByMarket('US'),
    getStockCountByMarket('Europe'),
    getLastUpdateTimeByMarket('Europe'),
  ]);

  return NextResponse.json({
    market,
    isScanning: scannerState[market].isScanning,
    progress: scannerState[market].progress,
    stockCount,
    totalStockCount,
    lastUpdate,
    totalStocks: getListStockCount(market),
    markets: {
      US: {
        isScanning: scannerState.US.isScanning,
        stockCount: usStockCount,
        totalStocks: US_STOCKS.length,
        lastUpdate: usLastUpdate,
      },
      Europe: {
        isScanning: scannerState.Europe.isScanning,
        stockCount: europeStockCount,
        totalStocks: EUROPE_STOCKS.length,
        lastUpdate: europeLastUpdate,
      },
    },
  });
}

export async function POST(request: Request) {
  const { action, market = 'US', batchSize = 20, startIndex = 0 } = await request.json() as {
    action: string;
    market: Market;
    batchSize: number;
    startIndex: number;
  };

  if (action === 'scan') {
    if (scannerState[market].isScanning) {
      return NextResponse.json({ error: `Scan already in progress for ${market}` }, { status: 400 });
    }

    const stockList = getStocksForMarket(market);

    // Start scanning in batches
    scannerState[market].isScanning = true;
    scannerState[market].progress = { current: startIndex, total: stockList.length, lastSymbol: '', errors: 0 };

    try {
      // Process a batch of stocks
      const endIndex = Math.min(startIndex + batchSize, stockList.length);
      const batch = stockList.slice(startIndex, endIndex);

      // Use parallel processing with concurrency of 5 for FMP, 8 for Yahoo
      const concurrency = market === 'US' ? 5 : 8;

      const results = await processBatchParallel(
        batch,
        market,
        concurrency,
        (symbol) => {
          scannerState[market].progress.lastSymbol = symbol;
          scannerState[market].progress.current++;
        }
      );

      scannerState[market].progress.errors = results.failed.length;

      const hasMore = endIndex < stockList.length;
      const finalStockCount = await getStockCountByMarket(market);

      return NextResponse.json({
        success: true,
        market,
        results,
        progress: {
          current: endIndex,
          total: stockList.length,
          percentage: Math.round((endIndex / stockList.length) * 100),
        },
        hasMore,
        nextIndex: hasMore ? endIndex : null,
        stockCount: finalStockCount,
      });
    } finally {
      scannerState[market].isScanning = false;
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
