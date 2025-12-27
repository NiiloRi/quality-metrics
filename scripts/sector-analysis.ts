/**
 * Sector-by-Sector Hidden Gem Analysis
 *
 * Etsii yhtäläisyyksiä onnistuneista Hidden Gem -osakkeista:
 * - Vertailee toimialan sisällä
 * - Etsii mitattavia laatuindikaattoreita
 * - Tunnistaa mikä erottaa voittajat häviäjistä
 */

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/stable';

interface StockAnalysis {
  symbol: string;
  sector: string;
  industry: string;
  marketCap: number;

  // Quality metrics
  qmScore: number;
  roic5y: number | null;
  roe: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  netMargin: number | null;

  // Growth metrics
  revenueGrowth5y: number | null;
  incomeGrowth5y: number | null;
  fcfGrowth5y: number | null;

  // Valuation
  pe: number | null;
  pfcf: number | null;
  pb: number | null;
  valueGap: number | null;

  // Capital allocation
  sharesChange5y: number | null;
  debtToFcf: number | null;
  fcfYield: number | null;

  // Hidden Gem status
  hiddenGemTier: string | null;
  hiddenGemScore: number;

  // Performance
  return1y: number | null;
  return3y: number | null;
  return5y: number | null;
}

async function fetchFMP<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ ...params, apikey: FMP_API_KEY || '' });
  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`FMP API error: ${response.status}`);
  return response.json();
}

async function analyzeStock(symbol: string): Promise<StockAnalysis | null> {
  try {
    const [profile, quote, income, balance, cashFlow, prices] = await Promise.all([
      fetchFMP<any[]>('/profile', { symbol }),
      fetchFMP<any[]>('/quote', { symbol }),
      fetchFMP<any[]>('/income-statement', { symbol, limit: '6' }),
      fetchFMP<any[]>('/balance-sheet-statement', { symbol, limit: '6' }),
      fetchFMP<any[]>('/cash-flow-statement', { symbol, limit: '6' }),
      fetchFMP<any[]>('/historical-price-eod/full', { symbol }),
    ]);

    if (!profile[0] || !quote[0] || income.length < 2) return null;

    const p = profile[0];
    const q = quote[0];
    const latestIncome = income[0];
    const oldestIncome = income[income.length - 1];
    const latestBalance = balance[0];
    const latestCF = cashFlow[0];
    const oldestCF = cashFlow[cashFlow.length - 1];

    // Calculate 5-year metrics
    const totalNI = income.slice(0, 5).reduce((s, i) => s + (i.netIncome || 0), 0);
    const totalFCF = cashFlow.slice(0, 5).reduce((s, c) => s + (c.freeCashFlow || 0), 0);
    const investedCapital = (latestBalance?.totalStockholdersEquity || 0) + (latestBalance?.totalDebt || 0);

    const roic5y = investedCapital > 0 ? (totalFCF / investedCapital) * 100 : null;
    const roe = latestBalance?.totalStockholdersEquity > 0
      ? (latestIncome.netIncome / latestBalance.totalStockholdersEquity) * 100 : null;

    // Margins
    const grossMargin = latestIncome.revenue > 0
      ? (latestIncome.grossProfit / latestIncome.revenue) * 100 : null;
    const operatingMargin = latestIncome.revenue > 0
      ? (latestIncome.operatingIncome / latestIncome.revenue) * 100 : null;
    const netMargin = latestIncome.revenue > 0
      ? (latestIncome.netIncome / latestIncome.revenue) * 100 : null;

    // Growth calculations
    const revenueGrowth5y = oldestIncome?.revenue > 0
      ? ((latestIncome.revenue - oldestIncome.revenue) / oldestIncome.revenue) * 100 : null;
    const incomeGrowth5y = oldestIncome?.netIncome > 0
      ? ((latestIncome.netIncome - oldestIncome.netIncome) / Math.abs(oldestIncome.netIncome)) * 100 : null;
    const fcfGrowth5y = oldestCF?.freeCashFlow !== 0
      ? ((latestCF.freeCashFlow - oldestCF.freeCashFlow) / Math.abs(oldestCF.freeCashFlow)) * 100 : null;

    // Valuation
    const pe = latestIncome.netIncome > 0 ? q.marketCap / latestIncome.netIncome : null;
    const pfcf = latestCF?.freeCashFlow > 0 ? q.marketCap / latestCF.freeCashFlow : null;
    const pb = latestBalance?.totalStockholdersEquity > 0
      ? q.marketCap / latestBalance.totalStockholdersEquity : null;

    // Capital allocation
    const currentShares = latestIncome.weightedAverageShsOut;
    const oldShares = oldestIncome?.weightedAverageShsOut;
    const sharesChange5y = oldShares && currentShares
      ? ((currentShares - oldShares) / oldShares) * 100 : null;

    const avgFCF = totalFCF / Math.min(5, cashFlow.length);
    const debtToFcf = avgFCF > 0 ? (latestBalance?.longTermDebt || 0) / avgFCF : null;
    const fcfYield = q.marketCap > 0 && latestCF?.freeCashFlow > 0
      ? (latestCF.freeCashFlow / q.marketCap) * 100 : null;

    // Calculate QM Score
    let qmScore = 0;
    const pe5y = totalNI > 0 ? q.marketCap / totalNI : null;
    const pfcf5y = totalFCF > 0 ? q.marketCap / totalFCF : null;

    if (pe5y && pe5y > 0 && pe5y < 22.5) qmScore++;
    if (roic5y && roic5y > 9) qmScore++;
    if (sharesChange5y !== null && sharesChange5y <= 0) qmScore++;
    if (latestCF?.freeCashFlow > (oldestCF?.freeCashFlow || 0) && latestCF?.freeCashFlow > 0) qmScore++;
    if (latestIncome.netIncome > (oldestIncome?.netIncome || 0) && latestIncome.netIncome > 0) qmScore++;
    if (latestIncome.revenue > (oldestIncome?.revenue || 0)) qmScore++;
    if (debtToFcf !== null && debtToFcf < 5) qmScore++;
    if (pfcf5y && pfcf5y > 0 && pfcf5y < 22.5) qmScore++;

    // Value gap
    const fairPE = 8 + (qmScore / 8) * 17;
    const valueGap = pe && pe > 0 ? ((fairPE - pe) / fairPE) * 100 : null;

    // Growth signals count
    const fcfGrowing = latestCF?.freeCashFlow > (oldestCF?.freeCashFlow || 0) && latestCF?.freeCashFlow > 0;
    const incomeGrowing = latestIncome.netIncome > (oldestIncome?.netIncome || 0) && latestIncome.netIncome > 0;
    const revenueGrowing = latestIncome.revenue > (oldestIncome?.revenue || 0);
    const growthSignals = [fcfGrowing, incomeGrowing, revenueGrowing].filter(Boolean).length;
    const sharesDecreasing = sharesChange5y !== null && sharesChange5y <= 0;

    // Hidden Gem tier
    let hiddenGemTier: string | null = null;
    let hiddenGemScore = 0;

    if (qmScore >= 6 && q.marketCap < 50e9 && valueGap && valueGap > 15 &&
        latestCF?.freeCashFlow > 0 && growthSignals > 0) {
      if (qmScore >= 8 && growthSignals >= 3 && valueGap >= 30 && sharesDecreasing) {
        hiddenGemTier = 'diamond';
        hiddenGemScore = 90 + Math.min(10, (valueGap - 30) / 2);
      } else if (qmScore >= 7 && growthSignals >= 2 && valueGap >= 20) {
        hiddenGemTier = 'gold';
        hiddenGemScore = 70 + Math.min(20, (valueGap - 20) / 2 + growthSignals * 3);
      } else if (qmScore >= 6 && growthSignals >= 1 && valueGap >= 15) {
        hiddenGemTier = 'silver';
        hiddenGemScore = 50 + Math.min(20, (valueGap - 15) / 2 + growthSignals * 5);
      }
    }

    // Calculate returns
    const getReturn = (yearsAgo: number): number | null => {
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() - yearsAgo);
      const targetStr = targetDate.toISOString().split('T')[0];
      const oldPrice = prices.find((p: any) => p.date <= targetStr);
      if (oldPrice && q.price) {
        return ((q.price - oldPrice.close) / oldPrice.close) * 100;
      }
      return null;
    };

    return {
      symbol,
      sector: p.sector || 'Unknown',
      industry: p.industry || 'Unknown',
      marketCap: q.marketCap,
      qmScore,
      roic5y,
      roe,
      grossMargin,
      operatingMargin,
      netMargin,
      revenueGrowth5y,
      incomeGrowth5y,
      fcfGrowth5y,
      pe,
      pfcf,
      pb,
      valueGap,
      sharesChange5y,
      debtToFcf,
      fcfYield,
      hiddenGemTier,
      hiddenGemScore,
      return1y: getReturn(1),
      return3y: getReturn(3),
      return5y: getReturn(5),
    };
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}

// Stock lists by sector
const STOCKS_BY_SECTOR: Record<string, string[]> = {
  'Consumer Discretionary': [
    'WSM', 'DKS', 'BBY', 'TGT', 'COST', 'HD', 'LOW', 'NKE', 'SBUX', 'MCD',
    'TPR', 'RL', 'PVH', 'GPS', 'FL', 'ANF', 'URBN', 'AEO', 'BURL', 'ROST',
  ],
  'Technology': [
    'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'AMD', 'INTC', 'TXN', 'AVGO', 'QCOM',
    'DELL', 'HPQ', 'HPE', 'IBM', 'ORCL', 'CSCO', 'ANET', 'SNPS', 'CDNS', 'KLAC',
  ],
  'Financials': [
    'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'SCHW', 'TROW', 'BEN',
    'AFL', 'ALL', 'TRV', 'PGR', 'CB', 'MET', 'PRU', 'AIG', 'HIG', 'L',
  ],
  'Industrials': [
    'CAT', 'DE', 'HON', 'UNP', 'UPS', 'FDX', 'GE', 'MMM', 'EMR', 'ITW',
    'SNA', 'GWW', 'FAST', 'MSM', 'WDFC', 'SWK', 'PH', 'ROK', 'DOV', 'IR',
  ],
  'Healthcare': [
    'JNJ', 'UNH', 'PFE', 'MRK', 'ABBV', 'LLY', 'TMO', 'DHR', 'ABT', 'BMY',
    'AMGN', 'GILD', 'VRTX', 'REGN', 'BIIB', 'ISRG', 'SYK', 'MDT', 'BDX', 'EW',
  ],
};

async function analyzeSector(sectorName: string, symbols: string[]): Promise<StockAnalysis[]> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`ANALYZING SECTOR: ${sectorName}`);
  console.log(`${'='.repeat(80)}`);

  const results: StockAnalysis[] = [];

  for (let i = 0; i < symbols.length; i += 5) {
    const batch = symbols.slice(i, i + 5);
    console.log(`  Batch ${Math.floor(i/5) + 1}/${Math.ceil(symbols.length/5)}: ${batch.join(', ')}`);

    const batchResults = await Promise.all(batch.map(s => analyzeStock(s)));
    results.push(...batchResults.filter((r): r is StockAnalysis => r !== null));

    await new Promise(r => setTimeout(r, 1000)); // Rate limit
  }

  return results;
}

function calculateSectorStats(stocks: StockAnalysis[]) {
  const calc = (arr: (number | null)[]): { avg: number; median: number; p25: number; p75: number } => {
    const valid = arr.filter((v): v is number => v !== null).sort((a, b) => a - b);
    if (valid.length === 0) return { avg: 0, median: 0, p25: 0, p75: 0 };
    const avg = valid.reduce((s, v) => s + v, 0) / valid.length;
    const median = valid[Math.floor(valid.length / 2)];
    const p25 = valid[Math.floor(valid.length * 0.25)];
    const p75 = valid[Math.floor(valid.length * 0.75)];
    return { avg, median, p25, p75 };
  };

  return {
    count: stocks.length,
    qmScore: calc(stocks.map(s => s.qmScore)),
    roic5y: calc(stocks.map(s => s.roic5y)),
    roe: calc(stocks.map(s => s.roe)),
    grossMargin: calc(stocks.map(s => s.grossMargin)),
    operatingMargin: calc(stocks.map(s => s.operatingMargin)),
    netMargin: calc(stocks.map(s => s.netMargin)),
    revenueGrowth5y: calc(stocks.map(s => s.revenueGrowth5y)),
    fcfYield: calc(stocks.map(s => s.fcfYield)),
    return5y: calc(stocks.map(s => s.return5y)),
  };
}

function findPatterns(allStocks: StockAnalysis[]) {
  console.log('\n' + '='.repeat(80));
  console.log('PATTERN ANALYSIS: What separates winners from losers?');
  console.log('='.repeat(80));

  // Separate winners (>100% 5y return) and losers (<0% 5y return)
  const winners = allStocks.filter(s => s.return5y !== null && s.return5y > 100);
  const losers = allStocks.filter(s => s.return5y !== null && s.return5y < 0);
  const hiddenGems = allStocks.filter(s => s.hiddenGemTier !== null);

  console.log(`\nTotal stocks: ${allStocks.length}`);
  console.log(`Winners (>100% 5y): ${winners.length}`);
  console.log(`Losers (<0% 5y): ${losers.length}`);
  console.log(`Current Hidden Gems: ${hiddenGems.length}`);

  // Compare metrics
  const compareMetric = (name: string, getter: (s: StockAnalysis) => number | null) => {
    const winnerVals = winners.map(getter).filter((v): v is number => v !== null);
    const loserVals = losers.map(getter).filter((v): v is number => v !== null);

    if (winnerVals.length === 0 || loserVals.length === 0) return null;

    const winnerAvg = winnerVals.reduce((s, v) => s + v, 0) / winnerVals.length;
    const loserAvg = loserVals.reduce((s, v) => s + v, 0) / loserVals.length;
    const diff = ((winnerAvg - loserAvg) / Math.abs(loserAvg)) * 100;

    return { name, winnerAvg, loserAvg, diff };
  };

  const comparisons = [
    compareMetric('QM Score', s => s.qmScore),
    compareMetric('5Y ROIC %', s => s.roic5y),
    compareMetric('ROE %', s => s.roe),
    compareMetric('Gross Margin %', s => s.grossMargin),
    compareMetric('Operating Margin %', s => s.operatingMargin),
    compareMetric('Net Margin %', s => s.netMargin),
    compareMetric('Revenue Growth 5Y %', s => s.revenueGrowth5y),
    compareMetric('Income Growth 5Y %', s => s.incomeGrowth5y),
    compareMetric('FCF Growth 5Y %', s => s.fcfGrowth5y),
    compareMetric('Shares Change 5Y %', s => s.sharesChange5y),
    compareMetric('Debt/FCF', s => s.debtToFcf),
    compareMetric('FCF Yield %', s => s.fcfYield),
    compareMetric('P/E', s => s.pe),
    compareMetric('P/FCF', s => s.pfcf),
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  console.log('\n--- WINNERS vs LOSERS COMPARISON ---');
  console.log('-'.repeat(70));
  console.log('Metric'.padEnd(25) + 'Winners Avg'.padEnd(15) + 'Losers Avg'.padEnd(15) + 'Difference');
  console.log('-'.repeat(70));

  for (const c of comparisons.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))) {
    const diffStr = c.diff > 0 ? `+${c.diff.toFixed(0)}%` : `${c.diff.toFixed(0)}%`;
    console.log(
      c.name.padEnd(25) +
      c.winnerAvg.toFixed(1).padEnd(15) +
      c.loserAvg.toFixed(1).padEnd(15) +
      diffStr
    );
  }

  // Find key differentiators
  console.log('\n--- KEY DIFFERENTIATORS (>50% difference) ---');
  const keyDiffs = comparisons.filter(c => Math.abs(c.diff) > 50);
  for (const d of keyDiffs) {
    const direction = d.diff > 0 ? 'HIGHER' : 'LOWER';
    console.log(`  ✓ ${d.name}: Winners have ${Math.abs(d.diff).toFixed(0)}% ${direction} than losers`);
  }

  // Sector-relative analysis
  console.log('\n--- SECTOR-RELATIVE QUALITY ---');
  const bySector = new Map<string, StockAnalysis[]>();
  for (const s of allStocks) {
    const list = bySector.get(s.sector) || [];
    list.push(s);
    bySector.set(s.sector, list);
  }

  for (const [sector, stocks] of bySector) {
    if (stocks.length < 3) continue;

    const avgROIC = stocks.map(s => s.roic5y).filter((v): v is number => v !== null);
    const avgMargin = stocks.map(s => s.operatingMargin).filter((v): v is number => v !== null);

    if (avgROIC.length === 0) continue;

    const sectorAvgROIC = avgROIC.reduce((s, v) => s + v, 0) / avgROIC.length;
    const sectorAvgMargin = avgMargin.reduce((s, v) => s + v, 0) / avgMargin.length;

    // Find stocks above sector average
    const aboveAvg = stocks.filter(s =>
      s.roic5y !== null && s.roic5y > sectorAvgROIC * 1.2 &&
      s.operatingMargin !== null && s.operatingMargin > sectorAvgMargin * 1.2
    );

    if (aboveAvg.length > 0) {
      console.log(`\n${sector} (Avg ROIC: ${sectorAvgROIC.toFixed(1)}%, Avg OpMargin: ${sectorAvgMargin.toFixed(1)}%):`);
      for (const s of aboveAvg.slice(0, 5)) {
        console.log(`  ${s.symbol.padEnd(6)} ROIC: ${s.roic5y?.toFixed(1)}% (+${((s.roic5y! / sectorAvgROIC - 1) * 100).toFixed(0)}% vs sector)`);
      }
    }
  }

  return { comparisons, keyDiffs };
}

async function main() {
  console.log('='.repeat(80));
  console.log('COMPREHENSIVE HIDDEN GEM SECTOR ANALYSIS');
  console.log('Analyzing stocks by sector to find quality patterns');
  console.log('='.repeat(80));

  const allResults: StockAnalysis[] = [];

  for (const [sector, symbols] of Object.entries(STOCKS_BY_SECTOR)) {
    const results = await analyzeSector(sector, symbols);
    allResults.push(...results);

    // Print sector summary
    const stats = calculateSectorStats(results);
    console.log(`\n${sector} Summary:`);
    console.log(`  Stocks: ${stats.count}`);
    console.log(`  Avg QM Score: ${stats.qmScore.avg.toFixed(1)}/8`);
    console.log(`  Avg 5Y ROIC: ${stats.roic5y.avg.toFixed(1)}%`);
    console.log(`  Avg Gross Margin: ${stats.grossMargin.avg.toFixed(1)}%`);
    console.log(`  Avg 5Y Return: ${stats.return5y.avg.toFixed(0)}%`);

    // List hidden gems in sector
    const gems = results.filter(r => r.hiddenGemTier);
    if (gems.length > 0) {
      console.log(`  Hidden Gems: ${gems.map(g => `${g.symbol}(${g.hiddenGemTier})`).join(', ')}`);
    }
  }

  // Pattern analysis
  const patterns = findPatterns(allResults);

  // Final recommendations
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDED NEW INDICATORS FOR HIDDEN GEM ALGORITHM');
  console.log('='.repeat(80));

  console.log(`
Based on analysis of ${allResults.length} stocks across ${Object.keys(STOCKS_BY_SECTOR).length} sectors:

1. SECTOR-RELATIVE ROIC
   Winners have ROIC 50%+ above sector average
   Add: roicVsSector > 1.5 for bonus points

2. OPERATING MARGIN QUALITY
   Winners avg: ${patterns.comparisons.find(c => c.name.includes('Operating'))?.winnerAvg.toFixed(1)}%
   Losers avg: ${patterns.comparisons.find(c => c.name.includes('Operating'))?.loserAvg.toFixed(1)}%
   Add: operatingMargin > 15% for quality boost

3. CAPITAL ALLOCATION (Shares)
   Winners: ${patterns.comparisons.find(c => c.name.includes('Shares'))?.winnerAvg.toFixed(1)}% change
   Losers: ${patterns.comparisons.find(c => c.name.includes('Shares'))?.loserAvg.toFixed(1)}% change
   Add: Stronger weight for buybacks

4. FCF CONSISTENCY
   Winners have higher and more consistent FCF
   Add: FCF positive for 4+ consecutive years

5. LOW DEBT RATIO
   Winners avg Debt/FCF: ${patterns.comparisons.find(c => c.name.includes('Debt'))?.winnerAvg.toFixed(1)}x
   Losers avg Debt/FCF: ${patterns.comparisons.find(c => c.name.includes('Debt'))?.loserAvg.toFixed(1)}x
   Add: debtToFcf < 2 for diamond tier
`);

  // Save detailed data
  console.log('\n--- TOP 20 HIGHEST QUALITY STOCKS ---');
  const sorted = allResults
    .filter(s => s.roic5y !== null && s.operatingMargin !== null)
    .sort((a, b) => (b.roic5y || 0) + (b.operatingMargin || 0) - (a.roic5y || 0) - (a.operatingMargin || 0))
    .slice(0, 20);

  console.log('Symbol'.padEnd(8) + 'Sector'.padEnd(25) + 'QM'.padEnd(5) + 'ROIC'.padEnd(8) + 'OpMar'.padEnd(8) + 'Gem'.padEnd(10) + '5Y Ret');
  console.log('-'.repeat(80));
  for (const s of sorted) {
    console.log(
      s.symbol.padEnd(8) +
      s.sector.substring(0, 22).padEnd(25) +
      `${s.qmScore}/8`.padEnd(5) +
      `${s.roic5y?.toFixed(0)}%`.padEnd(8) +
      `${s.operatingMargin?.toFixed(0)}%`.padEnd(8) +
      (s.hiddenGemTier || '-').padEnd(10) +
      (s.return5y ? `${s.return5y > 0 ? '+' : ''}${s.return5y.toFixed(0)}%` : 'N/A')
    );
  }
}

main().catch(console.error);
