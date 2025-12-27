/**
 * Hidden Gem Backtest Script
 *
 * Analysoi osakkeen historiallinen QM-score ja hidden gem -status
 * Vertaa historiallista pisteitä osakekurssin kehitykseen
 */

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/stable';

interface IncomeStatement {
  date: string;
  fiscalYear: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  weightedAverageShsOut: number;
}

interface BalanceSheet {
  date: string;
  fiscalYear: string;
  totalStockholdersEquity: number;
  totalDebt: number;
  longTermDebt: number;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
}

interface CashFlowStatement {
  date: string;
  fiscalYear: string;
  freeCashFlow: number;
}

interface HistoricalPrice {
  date: string;
  close: number;
}

interface Quote {
  symbol: string;
  price: number;
  marketCap: number;
  sharesOutstanding: number;
  yearHigh: number;
  yearLow: number;
}

async function fetchFMP<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ ...params, apikey: FMP_API_KEY || '' });
  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status}`);
  }
  return response.json();
}

async function getHistoricalPrice(symbol: string): Promise<HistoricalPrice[]> {
  return fetchFMP<HistoricalPrice[]>('/historical-price-eod/full', { symbol });
}

interface QMPillarResult {
  name: string;
  passed: boolean;
  value: number | null;
}

interface YearlyAnalysis {
  year: number;
  qmScore: number;
  pillars: QMPillarResult[];
  marketCap: number | null;
  stockPrice: number | null;
  pe: number | null;
  fairPE: number;
  valueGap: number | null;
  isHiddenGem: boolean;
  hiddenGemReasons: string[];
}

/**
 * Calculate QM Score for a specific year using 5-year lookback
 */
function calculateQMScoreForYear(
  year: number,
  income: IncomeStatement[],
  balance: BalanceSheet[],
  cashFlow: CashFlowStatement[],
  marketCapAtYear: number
): { score: number; pillars: QMPillarResult[] } {
  // Filter data up to and including the target year
  const incomeUpToYear = income.filter(i => parseInt(i.fiscalYear) <= year).slice(0, 5);
  const balanceUpToYear = balance.filter(b => parseInt(b.fiscalYear) <= year);
  const cashFlowUpToYear = cashFlow.filter(cf => parseInt(cf.fiscalYear) <= year).slice(0, 5);

  if (incomeUpToYear.length < 2 || cashFlowUpToYear.length < 2) {
    return { score: 0, pillars: [] };
  }

  const latestBalance = balanceUpToYear[0];
  const pillars: QMPillarResult[] = [];

  // Pillar 1: 5Y P/E
  const totalNetIncome = incomeUpToYear.reduce((sum, i) => sum + (i.netIncome || 0), 0);
  const pe5y = totalNetIncome > 0 ? marketCapAtYear / totalNetIncome : null;
  pillars.push({
    name: '5Y P/E',
    passed: pe5y !== null && pe5y < 22.5 && pe5y > 0,
    value: pe5y,
  });

  // Pillar 2: 5Y ROIC
  const totalFCF = cashFlowUpToYear.reduce((sum, cf) => sum + (cf.freeCashFlow || 0), 0);
  const investedCapital = latestBalance
    ? (latestBalance.totalStockholdersEquity || 0) + (latestBalance.totalDebt || 0)
    : 0;
  const roic5y = investedCapital > 0 ? (totalFCF / investedCapital) * 100 : null;
  pillars.push({
    name: '5Y ROIC',
    passed: roic5y !== null && roic5y > 9,
    value: roic5y,
  });

  // Pillar 3: Shares Outstanding (decreasing)
  const currentShares = incomeUpToYear[0]?.weightedAverageShsOut;
  const oldShares = incomeUpToYear[incomeUpToYear.length - 1]?.weightedAverageShsOut;
  const sharesChange = oldShares && currentShares ? ((currentShares - oldShares) / oldShares) * 100 : null;
  pillars.push({
    name: 'Shares',
    passed: sharesChange !== null && sharesChange <= 0,
    value: sharesChange,
  });

  // Pillar 4: FCF Growth
  const currentFCF = cashFlowUpToYear[0]?.freeCashFlow || 0;
  const oldFCF = cashFlowUpToYear[cashFlowUpToYear.length - 1]?.freeCashFlow || 0;
  const fcfGrowth = oldFCF !== 0 ? ((currentFCF - oldFCF) / Math.abs(oldFCF)) * 100 : null;
  pillars.push({
    name: 'FCF Growth',
    passed: currentFCF > oldFCF && currentFCF > 0,
    value: fcfGrowth,
  });

  // Pillar 5: Net Income Growth
  const currentIncome = incomeUpToYear[0]?.netIncome || 0;
  const oldIncome = incomeUpToYear[incomeUpToYear.length - 1]?.netIncome || 0;
  const incomeGrowth = oldIncome !== 0 ? ((currentIncome - oldIncome) / Math.abs(oldIncome)) * 100 : null;
  pillars.push({
    name: 'Income Growth',
    passed: currentIncome > oldIncome && currentIncome > 0,
    value: incomeGrowth,
  });

  // Pillar 6: Revenue Growth
  const currentRevenue = incomeUpToYear[0]?.revenue || 0;
  const oldRevenue = incomeUpToYear[incomeUpToYear.length - 1]?.revenue || 0;
  const revenueGrowth = oldRevenue !== 0 ? ((currentRevenue - oldRevenue) / Math.abs(oldRevenue)) * 100 : null;
  pillars.push({
    name: 'Revenue Growth',
    passed: currentRevenue > oldRevenue && currentRevenue > 0,
    value: revenueGrowth,
  });

  // Pillar 7: Debt Ratio
  const ltDebt = latestBalance?.longTermDebt || 0;
  const avgFCF = cashFlowUpToYear.reduce((sum, cf) => sum + (cf.freeCashFlow || 0), 0) / cashFlowUpToYear.length;
  const debtRatio = avgFCF > 0 ? ltDebt / avgFCF : null;
  pillars.push({
    name: 'Debt/FCF',
    passed: debtRatio !== null && debtRatio < 5,
    value: debtRatio,
  });

  // Pillar 8: 5Y P/FCF
  const pfcf5y = totalFCF > 0 ? marketCapAtYear / totalFCF : null;
  pillars.push({
    name: '5Y P/FCF',
    passed: pfcf5y !== null && pfcf5y < 22.5 && pfcf5y > 0,
    value: pfcf5y,
  });

  const score = pillars.filter(p => p.passed).length;
  return { score, pillars };
}

/**
 * Check if stock qualifies as Hidden Gem for a specific year
 */
function checkHiddenGemForYear(
  qmScore: number,
  marketCap: number,
  valueGap: number | null,
  fcf: number
): { isHiddenGem: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // QM Score >= 6
  if (qmScore < 6) {
    reasons.push(`QM Score ${qmScore} < 6`);
  }

  // Market Cap < $50B
  if (marketCap >= 50_000_000_000) {
    reasons.push(`Market Cap $${(marketCap / 1e9).toFixed(1)}B >= $50B`);
  }

  // Value Gap > 15%
  if (valueGap === null || valueGap <= 15) {
    reasons.push(`Value Gap ${valueGap?.toFixed(1) || 'N/A'}% <= 15%`);
  }

  // Positive FCF
  if (fcf <= 0) {
    reasons.push(`FCF ${fcf.toFixed(0)} <= 0`);
  }

  const isHiddenGem = reasons.length === 0;
  return { isHiddenGem, reasons };
}

async function backtestStock(symbol: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`HIDDEN GEM BACKTEST: ${symbol}`);
  console.log(`${'='.repeat(60)}\n`);

  // Fetch all data
  console.log('Fetching data...');
  const [income, balance, cashFlow, historicalPrices, quote] = await Promise.all([
    fetchFMP<IncomeStatement[]>('/income-statement', { symbol, limit: '15' }),
    fetchFMP<BalanceSheet[]>('/balance-sheet-statement', { symbol, limit: '15' }),
    fetchFMP<CashFlowStatement[]>('/cash-flow-statement', { symbol, limit: '15' }),
    getHistoricalPrice(symbol),
    fetchFMP<Quote[]>('/quote', { symbol }),
  ]);

  if (!income.length || !cashFlow.length) {
    console.log('No data available for this stock');
    return;
  }

  // Get year range
  const years = [...new Set(income.map(i => parseInt(i.fiscalYear)))].sort();
  const analysisYears = years.filter(y => y >= years[0] + 4); // Need 5 years of history

  console.log(`\nAnalyzing years: ${analysisYears.join(', ')}`);
  console.log(`Current price: $${quote[0]?.price?.toFixed(2) || 'N/A'}`);
  console.log(`Current market cap: $${((quote[0]?.marketCap || 0) / 1e9).toFixed(2)}B\n`);

  // Helper to get price at end of year
  const getPriceAtYear = (year: number): number | null => {
    const yearEnd = `${year}-12-31`;
    const yearStart = `${year}-01-01`;
    const pricesInYear = historicalPrices.filter(p => p.date >= yearStart && p.date <= yearEnd);
    return pricesInYear[0]?.close || null;
  };

  // Helper to estimate market cap at year
  const getMarketCapAtYear = (year: number): number | null => {
    const price = getPriceAtYear(year);
    const incomeForYear = income.find(i => parseInt(i.fiscalYear) === year);
    const shares = incomeForYear?.weightedAverageShsOut;
    if (price && shares) {
      return price * shares;
    }
    return null;
  };

  const results: YearlyAnalysis[] = [];

  for (const year of analysisYears) {
    const marketCap = getMarketCapAtYear(year);
    const stockPrice = getPriceAtYear(year);

    if (!marketCap) continue;

    const { score, pillars } = calculateQMScoreForYear(year, income, balance, cashFlow, marketCap);

    // Calculate P/E and valuation
    const latestIncome = income.find(i => parseInt(i.fiscalYear) === year)?.netIncome || 0;
    const pe = latestIncome > 0 ? marketCap / latestIncome : null;
    const fairPE = 8 + (score / 8) * 17;
    const valueGap = pe !== null && pe > 0 ? ((fairPE - pe) / fairPE) * 100 : null;

    // Check hidden gem
    const latestFCF = cashFlow.find(cf => parseInt(cf.fiscalYear) === year)?.freeCashFlow || 0;
    const { isHiddenGem, reasons } = checkHiddenGemForYear(score, marketCap, valueGap, latestFCF);

    results.push({
      year,
      qmScore: score,
      pillars,
      marketCap,
      stockPrice,
      pe,
      fairPE,
      valueGap,
      isHiddenGem,
      hiddenGemReasons: reasons,
    });
  }

  // Print results
  console.log('YEARLY ANALYSIS:');
  console.log('-'.repeat(100));
  console.log(
    'Year'.padEnd(6) +
    'QM'.padEnd(4) +
    'Price'.padEnd(10) +
    'MCap'.padEnd(12) +
    'P/E'.padEnd(8) +
    'FairPE'.padEnd(8) +
    'Gap%'.padEnd(8) +
    'Hidden Gem'.padEnd(12) +
    'Issues'
  );
  console.log('-'.repeat(100));

  for (const r of results) {
    const row =
      String(r.year).padEnd(6) +
      String(r.qmScore).padEnd(4) +
      (r.stockPrice ? `$${r.stockPrice.toFixed(2)}` : 'N/A').padEnd(10) +
      (r.marketCap ? `$${(r.marketCap / 1e9).toFixed(1)}B` : 'N/A').padEnd(12) +
      (r.pe ? r.pe.toFixed(1) : 'N/A').padEnd(8) +
      r.fairPE.toFixed(1).padEnd(8) +
      (r.valueGap ? `${r.valueGap > 0 ? '+' : ''}${r.valueGap.toFixed(0)}%` : 'N/A').padEnd(8) +
      (r.isHiddenGem ? '✅ YES' : '❌ NO').padEnd(12) +
      (r.hiddenGemReasons.length ? r.hiddenGemReasons.slice(0, 2).join(', ') : '-');

    console.log(row);
  }

  // Calculate returns
  if (results.length >= 2) {
    console.log('\n' + '-'.repeat(60));
    console.log('PERFORMANCE ANALYSIS:');
    console.log('-'.repeat(60));

    const firstPrice = results[0]?.stockPrice;
    const lastPrice = results[results.length - 1]?.stockPrice;
    const currentPrice = quote[0]?.price;

    if (firstPrice && lastPrice) {
      const totalReturn = ((lastPrice - firstPrice) / firstPrice) * 100;
      console.log(`\nFrom ${results[0].year} to ${results[results.length - 1].year}:`);
      console.log(`  Price: $${firstPrice.toFixed(2)} → $${lastPrice.toFixed(2)}`);
      console.log(`  Return: ${totalReturn > 0 ? '+' : ''}${totalReturn.toFixed(1)}%`);
    }

    if (firstPrice && currentPrice) {
      const totalReturnToNow = ((currentPrice - firstPrice) / firstPrice) * 100;
      console.log(`\nFrom ${results[0].year} to NOW:`);
      console.log(`  Price: $${firstPrice.toFixed(2)} → $${currentPrice.toFixed(2)}`);
      console.log(`  Return: ${totalReturnToNow > 0 ? '+' : ''}${totalReturnToNow.toFixed(1)}%`);
    }

    // Find hidden gem periods
    const hiddenGemYears = results.filter(r => r.isHiddenGem).map(r => r.year);
    console.log(`\n✨ Hidden Gem years: ${hiddenGemYears.length ? hiddenGemYears.join(', ') : 'None'}`);

    // QM Score trend
    const firstQM = results[0]?.qmScore || 0;
    const lastQM = results[results.length - 1]?.qmScore || 0;
    console.log(`📊 QM Score trend: ${firstQM}/8 → ${lastQM}/8`);
  }

  // Detailed pillar analysis for each year
  console.log('\n' + '-'.repeat(60));
  console.log('PILLAR DETAILS BY YEAR:');
  console.log('-'.repeat(60));

  for (const r of results) {
    console.log(`\n${r.year} (QM: ${r.qmScore}/8):`);
    for (const p of r.pillars) {
      const status = p.passed ? '✅' : '❌';
      const value = p.value !== null ? p.value.toFixed(1) : 'N/A';
      console.log(`  ${status} ${p.name.padEnd(15)} = ${value}`);
    }
  }
}

// Run backtest
const symbol = process.argv[2] || 'AAPL';
backtestStock(symbol).catch(console.error);
