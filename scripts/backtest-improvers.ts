/**
 * Backtest: QM Score Improvers Analysis
 *
 * Etsii osakkeet jotka ovat nousseet 6/8 → 8/8 ja analysoi
 * olisiko Hidden Gem -indikaattori havainnut nousun etukäteen
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

interface YearlyQMAnalysis {
  year: number;
  qmScore: number;
  pillars: QMPillarResult[];
  marketCap: number | null;
  stockPrice: number | null;
  pe: number | null;
  fairPE: number;
  valueGap: number | null;
  growthSignals: number;
  isImproving: boolean;
  hiddenGemTier: 'diamond' | 'gold' | 'silver' | null;
  hiddenGemScore: number;
}

function calculateQMScoreForYear(
  year: number,
  income: IncomeStatement[],
  balance: BalanceSheet[],
  cashFlow: CashFlowStatement[],
  marketCapAtYear: number
): { score: number; pillars: QMPillarResult[]; growthSignals: number } {
  const incomeUpToYear = income.filter(i => parseInt(i.fiscalYear) <= year).slice(0, 5);
  const balanceUpToYear = balance.filter(b => parseInt(b.fiscalYear) <= year);
  const cashFlowUpToYear = cashFlow.filter(cf => parseInt(cf.fiscalYear) <= year).slice(0, 5);

  if (incomeUpToYear.length < 2 || cashFlowUpToYear.length < 2) {
    return { score: 0, pillars: [], growthSignals: 0 };
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

  // Pillar 3: Shares Outstanding
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
  const fcfPassed = currentFCF > oldFCF && currentFCF > 0;
  pillars.push({
    name: 'FCF Growth',
    passed: fcfPassed,
    value: fcfGrowth,
  });

  // Pillar 5: Net Income Growth
  const currentIncome = incomeUpToYear[0]?.netIncome || 0;
  const oldIncome = incomeUpToYear[incomeUpToYear.length - 1]?.netIncome || 0;
  const incomeGrowth = oldIncome !== 0 ? ((currentIncome - oldIncome) / Math.abs(oldIncome)) * 100 : null;
  const incomePassed = currentIncome > oldIncome && currentIncome > 0;
  pillars.push({
    name: 'Income Growth',
    passed: incomePassed,
    value: incomeGrowth,
  });

  // Pillar 6: Revenue Growth
  const currentRevenue = incomeUpToYear[0]?.revenue || 0;
  const oldRevenue = incomeUpToYear[incomeUpToYear.length - 1]?.revenue || 0;
  const revenueGrowth = oldRevenue !== 0 ? ((currentRevenue - oldRevenue) / Math.abs(oldRevenue)) * 100 : null;
  const revenuePassed = currentRevenue > oldRevenue && currentRevenue > 0;
  pillars.push({
    name: 'Revenue Growth',
    passed: revenuePassed,
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
  const growthSignals = [fcfPassed, incomePassed, revenuePassed].filter(Boolean).length;

  return { score, pillars, growthSignals };
}

/**
 * Calculate Hidden Gem tier using improved logic
 */
function calculateHiddenGemTier(
  qmScore: number,
  valueGap: number | null,
  growthSignals: number,
  sharesDecreasing: boolean,
  marketCap: number,
  fcfPositive: boolean
): { tier: 'diamond' | 'gold' | 'silver' | null; score: number } {
  // Base requirements
  if (
    qmScore < 6 ||
    marketCap >= 50_000_000_000 ||
    valueGap === null || valueGap <= 15 ||
    !fcfPositive
  ) {
    return { tier: null, score: 0 };
  }

  // No growth signals = value trap (learned from TROW)
  if (growthSignals === 0) {
    return { tier: null, score: 0 };
  }

  let tier: 'diamond' | 'gold' | 'silver' | null = null;
  let confidenceScore = 0;

  // Diamond: QM 8/8, all growth, deep value, buybacks
  if (qmScore >= 8 && growthSignals >= 3 && valueGap >= 30 && sharesDecreasing) {
    tier = 'diamond';
    confidenceScore = 90 + Math.min(10, (valueGap - 30) / 2);
  }
  // Gold: QM 7+, good growth, solid value
  else if (qmScore >= 7 && growthSignals >= 2 && valueGap >= 20) {
    tier = 'gold';
    confidenceScore = 70 + Math.min(20, (valueGap - 20) / 2 + growthSignals * 3);
  }
  // Silver: QM 6+, some growth, undervalued
  else if (qmScore >= 6 && growthSignals >= 1 && valueGap >= 15) {
    tier = 'silver';
    confidenceScore = 50 + Math.min(20, (valueGap - 15) / 2 + growthSignals * 5);
  }

  if (sharesDecreasing && tier !== 'diamond') {
    confidenceScore += 5;
  }

  return { tier, score: Math.min(100, Math.round(confidenceScore)) };
}

async function analyzeImprover(symbol: string): Promise<{
  symbol: string;
  hadImprovement: boolean;
  improvementYear: number | null;
  beforeScore: number;
  afterScore: number;
  wasHiddenGemBefore: boolean;
  hiddenGemTierBefore: string | null;
  priceAtImprovement: number | null;
  priceNow: number | null;
  returnSinceImprovement: number | null;
  yearlyData: YearlyQMAnalysis[];
}> {
  console.log(`\nAnalyzing ${symbol}...`);

  const [income, balance, cashFlow, historicalPrices, quote] = await Promise.all([
    fetchFMP<IncomeStatement[]>('/income-statement', { symbol, limit: '15' }),
    fetchFMP<BalanceSheet[]>('/balance-sheet-statement', { symbol, limit: '15' }),
    fetchFMP<CashFlowStatement[]>('/cash-flow-statement', { symbol, limit: '15' }),
    getHistoricalPrice(symbol),
    fetchFMP<Quote[]>('/quote', { symbol }),
  ]);

  if (!income.length || !cashFlow.length) {
    return {
      symbol,
      hadImprovement: false,
      improvementYear: null,
      beforeScore: 0,
      afterScore: 0,
      wasHiddenGemBefore: false,
      hiddenGemTierBefore: null,
      priceAtImprovement: null,
      priceNow: null,
      returnSinceImprovement: null,
      yearlyData: [],
    };
  }

  const years = [...new Set(income.map(i => parseInt(i.fiscalYear)))].sort();
  const analysisYears = years.filter(y => y >= years[0] + 4);

  const getPriceAtYear = (year: number): number | null => {
    const yearEnd = `${year}-12-31`;
    const yearStart = `${year}-01-01`;
    const pricesInYear = historicalPrices.filter(p => p.date >= yearStart && p.date <= yearEnd);
    return pricesInYear[0]?.close || null;
  };

  const getMarketCapAtYear = (year: number): number | null => {
    const price = getPriceAtYear(year);
    const incomeForYear = income.find(i => parseInt(i.fiscalYear) === year);
    const shares = incomeForYear?.weightedAverageShsOut;
    if (price && shares) {
      return price * shares;
    }
    return null;
  };

  const yearlyData: YearlyQMAnalysis[] = [];
  let previousScore = 0;

  for (const year of analysisYears) {
    const marketCap = getMarketCapAtYear(year);
    const stockPrice = getPriceAtYear(year);

    if (!marketCap) continue;

    const { score, pillars, growthSignals } = calculateQMScoreForYear(year, income, balance, cashFlow, marketCap);

    const latestIncome = income.find(i => parseInt(i.fiscalYear) === year)?.netIncome || 0;
    const pe = latestIncome > 0 ? marketCap / latestIncome : null;
    const fairPE = 8 + (score / 8) * 17;
    const valueGap = pe !== null && pe > 0 ? ((fairPE - pe) / fairPE) * 100 : null;

    const sharesDecreasing = pillars.find(p => p.name === 'Shares')?.passed ?? false;
    const fcfPositive = (cashFlow.find(cf => parseInt(cf.fiscalYear) === year)?.freeCashFlow ?? 0) > 0;

    const { tier, score: gemScore } = calculateHiddenGemTier(
      score,
      valueGap,
      growthSignals,
      sharesDecreasing,
      marketCap,
      fcfPositive
    );

    const isImproving = score > previousScore;
    previousScore = score;

    yearlyData.push({
      year,
      qmScore: score,
      pillars,
      marketCap,
      stockPrice,
      pe,
      fairPE,
      valueGap,
      growthSignals,
      isImproving,
      hiddenGemTier: tier,
      hiddenGemScore: gemScore,
    });
  }

  // Find improvement from 6 or lower to 8
  let improvementYear: number | null = null;
  let beforeScore = 0;
  let afterScore = 0;
  let wasHiddenGemBefore = false;
  let hiddenGemTierBefore: string | null = null;
  let priceAtImprovement: number | null = null;

  for (let i = 1; i < yearlyData.length; i++) {
    const prev = yearlyData[i - 1];
    const curr = yearlyData[i];

    // Look for jump to 8/8 from 6 or lower
    if (prev.qmScore <= 6 && curr.qmScore === 8) {
      improvementYear = curr.year;
      beforeScore = prev.qmScore;
      afterScore = curr.qmScore;
      wasHiddenGemBefore = prev.hiddenGemTier !== null;
      hiddenGemTierBefore = prev.hiddenGemTier;
      priceAtImprovement = prev.stockPrice;
      break;
    }
    // Also check gradual improvement (6→7→8)
    if (prev.qmScore === 6 && curr.qmScore >= 7 && !improvementYear) {
      // Keep looking but mark this as start of improvement
      const futureEight = yearlyData.slice(i).find(y => y.qmScore === 8);
      if (futureEight) {
        improvementYear = curr.year;
        beforeScore = prev.qmScore;
        afterScore = futureEight.qmScore;
        wasHiddenGemBefore = prev.hiddenGemTier !== null;
        hiddenGemTierBefore = prev.hiddenGemTier;
        priceAtImprovement = prev.stockPrice;
      }
    }
  }

  const priceNow = quote[0]?.price || null;
  const returnSinceImprovement = priceAtImprovement && priceNow
    ? ((priceNow - priceAtImprovement) / priceAtImprovement) * 100
    : null;

  return {
    symbol,
    hadImprovement: improvementYear !== null,
    improvementYear,
    beforeScore,
    afterScore,
    wasHiddenGemBefore,
    hiddenGemTierBefore,
    priceAtImprovement,
    priceNow,
    returnSinceImprovement,
    yearlyData,
  };
}

// Candidate stocks - focus on value/small-mid cap that might have been hidden gems
const CANDIDATES = [
  // Value/Quality stocks that were beaten down
  'WSM',   // Williams-Sonoma (known hidden gem)
  'DKS',   // Dick's Sporting Goods (known hidden gem)
  'POOL',  // Pool Corp
  'BBY',   // Best Buy
  'GPS',   // Gap Inc
  'FL',    // Foot Locker
  'TPR',   // Tapestry
  'RL',    // Ralph Lauren
  'PVH',   // PVH Corp
  'GIII',  // G-III Apparel
  // Industrial/Value
  'SNA',   // Snap-On
  'GWW',   // Grainger
  'FAST',  // Fastenal
  'MSM',   // MSC Industrial
  'WDFC',  // WD-40
  // Financial/Insurance
  'ALL',   // Allstate
  'TRV',   // Travelers
  'PGR',   // Progressive
  'CB',    // Chubb
  'AFL',   // Aflac
  // Tech value
  'HPQ',   // HP Inc
  'DELL',  // Dell
  'CSCO',  // Cisco
  'IBM',   // IBM
  'ORCL',  // Oracle
];

async function runAnalysis() {
  console.log('='.repeat(80));
  console.log('QM SCORE IMPROVERS ANALYSIS: 6/8 → 8/8');
  console.log('Checking if Hidden Gem indicator would have spotted the improvement');
  console.log('='.repeat(80));

  const results = [];

  for (const symbol of CANDIDATES) {
    try {
      const result = await analyzeImprover(symbol);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 500)); // Rate limit
    } catch (error) {
      console.error(`Error analyzing ${symbol}:`, error);
    }
  }

  // Filter to only stocks that had improvement
  const improvers = results.filter(r => r.hadImprovement);

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY: Stocks with QM Score Improvement (≤6 → 8)');
  console.log('='.repeat(80));

  if (improvers.length === 0) {
    console.log('\nNo clear 6→8 improvers found. Showing all QM trends:\n');

    // Show QM trends for all stocks
    for (const r of results) {
      if (r.yearlyData.length > 0) {
        const first = r.yearlyData[0];
        const last = r.yearlyData[r.yearlyData.length - 1];
        const trend = last.qmScore > first.qmScore ? '↑' : last.qmScore < first.qmScore ? '↓' : '→';

        const hadGem = r.yearlyData.some(y => y.hiddenGemTier !== null);
        const gemYears = r.yearlyData.filter(y => y.hiddenGemTier !== null).map(y => `${y.year}(${y.hiddenGemTier})`).join(', ');

        console.log(
          `${r.symbol.padEnd(6)} | QM: ${first.qmScore}→${last.qmScore} ${trend} | ` +
          `Hidden Gem: ${hadGem ? gemYears : 'Never'}`
        );
      }
    }
  } else {
    console.log(`\nFound ${improvers.length} stocks with significant QM improvement:\n`);

    console.log('-'.repeat(100));
    console.log(
      'Symbol'.padEnd(8) +
      'Improvement'.padEnd(14) +
      'Year'.padEnd(6) +
      'Was HiddenGem?'.padEnd(16) +
      'Tier'.padEnd(10) +
      'Price Then'.padEnd(12) +
      'Price Now'.padEnd(12) +
      'Return'
    );
    console.log('-'.repeat(100));

    for (const r of improvers) {
      console.log(
        r.symbol.padEnd(8) +
        `${r.beforeScore}/8 → ${r.afterScore}/8`.padEnd(14) +
        String(r.improvementYear || 'N/A').padEnd(6) +
        (r.wasHiddenGemBefore ? '✅ YES' : '❌ NO').padEnd(16) +
        (r.hiddenGemTierBefore || 'N/A').padEnd(10) +
        (r.priceAtImprovement ? `$${r.priceAtImprovement.toFixed(2)}` : 'N/A').padEnd(12) +
        (r.priceNow ? `$${r.priceNow.toFixed(2)}` : 'N/A').padEnd(12) +
        (r.returnSinceImprovement !== null ? `${r.returnSinceImprovement > 0 ? '+' : ''}${r.returnSinceImprovement.toFixed(0)}%` : 'N/A')
      );
    }
  }

  // Detailed yearly breakdown for top results
  console.log('\n' + '='.repeat(80));
  console.log('DETAILED YEARLY BREAKDOWN');
  console.log('='.repeat(80));

  const toShow = improvers.length > 0 ? improvers.slice(0, 5) : results.slice(0, 10);

  for (const r of toShow) {
    if (r.yearlyData.length === 0) continue;

    console.log(`\n${r.symbol}:`);
    console.log('-'.repeat(90));
    console.log(
      'Year'.padEnd(6) +
      'QM'.padEnd(4) +
      'Growth'.padEnd(8) +
      'Price'.padEnd(10) +
      'Value Gap'.padEnd(12) +
      'Gem Tier'.padEnd(10) +
      'Score'.padEnd(8) +
      'Improving'
    );
    console.log('-'.repeat(90));

    for (const y of r.yearlyData) {
      console.log(
        String(y.year).padEnd(6) +
        `${y.qmScore}/8`.padEnd(4) +
        `${y.growthSignals}/3`.padEnd(8) +
        (y.stockPrice ? `$${y.stockPrice.toFixed(2)}` : 'N/A').padEnd(10) +
        (y.valueGap !== null ? `${y.valueGap > 0 ? '+' : ''}${y.valueGap.toFixed(0)}%` : 'N/A').padEnd(12) +
        (y.hiddenGemTier || '-').padEnd(10) +
        String(y.hiddenGemScore).padEnd(8) +
        (y.isImproving ? '↑' : '')
      );
    }
  }

  // Key insights
  console.log('\n' + '='.repeat(80));
  console.log('KEY INSIGHTS');
  console.log('='.repeat(80));

  const hiddenGemHits = results.filter(r =>
    r.yearlyData.some(y => y.hiddenGemTier !== null)
  );

  console.log(`\n📊 Analyzed: ${results.length} stocks`);
  console.log(`📈 Had Hidden Gem status at some point: ${hiddenGemHits.length}`);
  console.log(`🎯 Improved from ≤6 to 8: ${improvers.length}`);

  if (improvers.length > 0) {
    const correctPredictions = improvers.filter(r => r.wasHiddenGemBefore).length;
    console.log(`\n✨ Hidden Gem correctly predicted improvement: ${correctPredictions}/${improvers.length} (${((correctPredictions / improvers.length) * 100).toFixed(0)}%)`);
  }
}

runAnalysis().catch(console.error);
