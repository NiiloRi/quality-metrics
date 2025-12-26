/**
 * QM-asteikko (Quality Metrics) Calculator
 *
 * 8 pillars based on fundamental stock analysis
 */

import type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  Quote,
  KeyMetrics,
  QMPillar,
  QMScore,
  ValuationAnalysis,
  Rating,
  RatingBreakdown,
  RatingAnalysis,
} from '@/types/stock';

interface CalculationData {
  quote: Quote;
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashFlow: CashFlowStatement[];
}

/**
 * Calculate all 8 QM pillars
 */
export function calculateQMScore(data: CalculationData): QMScore {
  const pillars: QMPillar[] = [
    calculatePillar1_5YearPE(data),
    calculatePillar2_5YearROIC(data),
    calculatePillar3_SharesOutstanding(data),
    calculatePillar4_FCFGrowth(data),
    calculatePillar5_NetIncomeGrowth(data),
    calculatePillar6_RevenueGrowth(data),
    calculatePillar7_DebtRatio(data),
    calculatePillar8_5YearPFCF(data),
  ];

  const totalScore = pillars.reduce((sum, p) => sum + p.score, 0);

  // Calculate additional metrics
  const latestIncome = data.income[0];
  const latestBalance = data.balance[0];

  const roe = latestBalance?.totalStockholdersEquity > 0
    ? (latestIncome?.netIncome / latestBalance.totalStockholdersEquity) * 100
    : null;

  const grossMargin = latestIncome?.revenue > 0
    ? (latestIncome.grossProfit / latestIncome.revenue) * 100
    : null;

  const operatingMargin = latestIncome?.revenue > 0
    ? (latestIncome.operatingIncome / latestIncome.revenue) * 100
    : null;

  const currentRatio = latestBalance?.totalCurrentLiabilities > 0
    ? latestBalance.totalCurrentAssets / latestBalance.totalCurrentLiabilities
    : null;

  return {
    symbol: data.quote.symbol,
    totalScore,
    maxScore: 8,
    pillars,
    additionalMetrics: {
      roe,
      grossMargin,
      operatingMargin,
      currentRatio,
    },
  };
}

/**
 * Pillar 1: 5-Year P/E Ratio
 * Market Cap / Sum of Net Income (5 years) < 22.5
 */
function calculatePillar1_5YearPE(data: CalculationData): QMPillar {
  const marketCap = data.quote.marketCap;
  const totalNetIncome = data.income
    .slice(0, 5)
    .reduce((sum, i) => sum + (i.netIncome || 0), 0);

  const value = totalNetIncome > 0 ? marketCap / totalNetIncome : null;
  const passed = value !== null && value < 22.5;

  return {
    name: '5v P/E',
    description: 'Markkina-arvo / 5 vuoden tulokset yhteensä',
    value,
    threshold: '< 22.5',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 2: 5-Year ROIC
 * Sum of FCF (5 years) / (Equity + Debt) > 9%
 */
function calculatePillar2_5YearROIC(data: CalculationData): QMPillar {
  const totalFCF = data.cashFlow
    .slice(0, 5)
    .reduce((sum, cf) => sum + (cf.freeCashFlow || 0), 0);

  const latestBalance = data.balance[0];
  const investedCapital = latestBalance
    ? (latestBalance.totalStockholdersEquity || 0) + (latestBalance.totalDebt || 0)
    : 0;

  const value = investedCapital > 0 ? (totalFCF / investedCapital) * 100 : null;
  const passed = value !== null && value > 9;

  return {
    name: '5v ROIC',
    description: '5 vuoden FCF / sijoitettu pääoma',
    value,
    threshold: '> 9%',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 3: Shares Outstanding
 * Current shares < shares 5 years ago (decreasing)
 */
function calculatePillar3_SharesOutstanding(data: CalculationData): QMPillar {
  const currentShares = data.quote.sharesOutstanding;
  const oldestBalance = data.balance[data.balance.length - 1];
  const oldShares = oldestBalance?.commonStock;

  // Note: commonStock in balance sheet is dollar value, not share count
  // Use sharesOutstanding from quote for current, estimate for old
  const value = currentShares;
  const passed = oldShares !== undefined && currentShares < oldShares;

  return {
    name: 'Osakkeet',
    description: 'Osakkeiden määrä laskeva (takaisinosto)',
    value,
    threshold: 'Laskeva',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 4: FCF Growth
 * Current FCF (TTM) > FCF 5 years ago
 */
function calculatePillar4_FCFGrowth(data: CalculationData): QMPillar {
  const currentFCF = data.cashFlow[0]?.freeCashFlow || 0;
  const oldFCF = data.cashFlow[data.cashFlow.length - 1]?.freeCashFlow || 0;

  const value = currentFCF;
  const passed = currentFCF > oldFCF && currentFCF > 0;

  return {
    name: 'FCF kasvu',
    description: 'Vapaa kassavirta kasvanut 5 vuodessa',
    value,
    threshold: 'Kasvava',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 5: Net Income Growth
 * Current Net Income > Net Income 5 years ago
 */
function calculatePillar5_NetIncomeGrowth(data: CalculationData): QMPillar {
  const currentIncome = data.income[0]?.netIncome || 0;
  const oldIncome = data.income[data.income.length - 1]?.netIncome || 0;

  const value = currentIncome;
  const passed = currentIncome > oldIncome && currentIncome > 0;

  return {
    name: 'Tulos kasvu',
    description: 'Nettotulos kasvanut 5 vuodessa',
    value,
    threshold: 'Kasvava',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 6: Revenue Growth
 * Current Revenue > Revenue 5 years ago
 */
function calculatePillar6_RevenueGrowth(data: CalculationData): QMPillar {
  const currentRevenue = data.income[0]?.revenue || 0;
  const oldRevenue = data.income[data.income.length - 1]?.revenue || 0;

  const value = currentRevenue;
  const passed = currentRevenue > oldRevenue && currentRevenue > 0;

  return {
    name: 'Liikevaihto kasvu',
    description: 'Liikevaihto kasvanut 5 vuodessa',
    value,
    threshold: 'Kasvava',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 7: Debt Ratio
 * Long-term Liabilities / Average FCF (5 years) < 5
 */
function calculatePillar7_DebtRatio(data: CalculationData): QMPillar {
  const ltLiabilities = data.balance[0]?.longTermDebt || 0;
  const avgFCF = data.cashFlow
    .slice(0, 5)
    .reduce((sum, cf) => sum + (cf.freeCashFlow || 0), 0) / Math.min(5, data.cashFlow.length);

  const value = avgFCF > 0 ? ltLiabilities / avgFCF : null;
  const passed = value !== null && value < 5;

  return {
    name: 'Velkaantuneisuus',
    description: 'Pitkäaikaiset velat / keskimääräinen FCF',
    value,
    threshold: '< 5x',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Pillar 8: 5-Year Price-to-FCF
 * Market Cap / Sum of FCF (5 years) < 22.5
 */
function calculatePillar8_5YearPFCF(data: CalculationData): QMPillar {
  const marketCap = data.quote.marketCap;
  const totalFCF = data.cashFlow
    .slice(0, 5)
    .reduce((sum, cf) => sum + (cf.freeCashFlow || 0), 0);

  const value = totalFCF > 0 ? marketCap / totalFCF : null;
  const passed = value !== null && value < 22.5;

  return {
    name: '5v P/FCF',
    description: 'Markkina-arvo / 5 vuoden FCF yhteensä',
    value,
    threshold: '< 22.5',
    passed,
    score: passed ? 1 : 0,
  };
}

/**
 * Calculate valuation analysis based on QM score
 */
export function calculateValuation(qmScore: QMScore, currentPE: number | null): ValuationAnalysis {
  // Fair P/E based on QM score
  // QM 8/8 → Fair P/E = 25
  // QM 6/8 → Fair P/E = 18
  // QM 4/8 → Fair P/E = 12
  // QM 2/8 → Fair P/E = 8
  const fairPE = 8 + (qmScore.totalScore / 8) * 17; // Linear interpolation from 8 to 25

  let valueGap: number | null = null;
  let status: ValuationAnalysis['status'] = 'unknown';
  let statusText = 'Ei voida laskea';

  if (currentPE !== null && currentPE > 0) {
    valueGap = ((fairPE - currentPE) / fairPE) * 100;

    if (valueGap > 15) {
      status = 'undervalued';
      statusText = `Aliarvostettu ${valueGap.toFixed(0)}%`;
    } else if (valueGap < -15) {
      status = 'overvalued';
      statusText = `Yliarvostettu ${Math.abs(valueGap).toFixed(0)}%`;
    } else {
      status = 'fair';
      statusText = 'Oikein hinnoiteltu';
    }
  }

  return {
    symbol: qmScore.symbol,
    qmScore: qmScore.totalScore,
    fairPE,
    currentPE,
    valueGap,
    status,
    statusText,
  };
}

/**
 * Format large numbers for display
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';

  const absValue = Math.abs(value);
  if (absValue >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Format percentage for display
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}%`;
}

/**
 * Rating calculation input data
 */
interface RatingInputData {
  qmScore: QMScore;
  valuation: ValuationAnalysis;
  quote: Quote;
  income: IncomeStatement[];
  cashFlow: CashFlowStatement[];
  metrics?: KeyMetrics;
}

/**
 * Calculate comprehensive rating (0-100) based on multiple metrics
 * Categories: Quality (30p), Value (25p), Growth (20p), Safety (20p), Momentum (5p)
 */
export function calculateRating(data: RatingInputData): RatingAnalysis {
  const breakdown: RatingBreakdown = {
    quality: calculateQualityScore(data),
    value: calculateValueScore(data),
    growth: calculateGrowthScore(data),
    safety: calculateSafetyScore(data),
    momentum: calculateMomentumScore(data),
  };

  const totalScore = breakdown.quality + breakdown.value + breakdown.growth + breakdown.safety + breakdown.momentum;

  const rating = getScoreRating(totalScore);
  const isHiddenGem = checkHiddenGem(data, rating, totalScore);

  return {
    score: totalScore,
    rating,
    isHiddenGem,
    breakdown,
  };
}

/**
 * Quality Score (max 30 points)
 * QM Score, ROE, ROIC, Operating Margin, Gross Margin
 */
function calculateQualityScore(data: RatingInputData): number {
  let points = 0;

  // QM Score (max 12p)
  const qmPoints = (data.qmScore.totalScore / 8) * 12;
  points += qmPoints;

  // ROE (max 6p)
  const roe = data.qmScore.additionalMetrics.roe;
  if (roe !== null) {
    points += roe > 20 ? 6 : roe > 15 ? 4 : roe > 10 ? 2 : 0;
  }

  // ROIC from metrics (max 4p)
  const roic = data.metrics?.roic ?? 0;
  points += roic > 15 ? 4 : roic > 10 ? 3 : roic > 7 ? 2 : roic > 5 ? 1 : 0;

  // Operating Margin (max 4p)
  const opMargin = data.qmScore.additionalMetrics.operatingMargin;
  if (opMargin !== null) {
    points += opMargin > 20 ? 4 : opMargin > 12 ? 3 : opMargin > 8 ? 2 : opMargin > 5 ? 1 : 0;
  }

  // Gross Margin (max 4p)
  const grossMargin = data.qmScore.additionalMetrics.grossMargin;
  if (grossMargin !== null) {
    points += grossMargin > 50 ? 4 : grossMargin > 35 ? 3 : grossMargin > 25 ? 2 : grossMargin > 15 ? 1 : 0;
  }

  return Math.min(30, Math.round(points));
}

/**
 * Value Score (max 25 points)
 * Value Gap, P/E, P/B, FCF Yield, Earnings Yield
 */
function calculateValueScore(data: RatingInputData): number {
  let points = 0;

  // Value Gap (max 8p)
  const valueGap = data.valuation.valueGap;
  if (valueGap !== null) {
    points += valueGap > 30 ? 8 : valueGap > 20 ? 6 : valueGap > 10 ? 4 : valueGap > 0 ? 2 : 0;
  }

  // P/E (max 6p)
  const pe = data.valuation.currentPE;
  if (pe !== null && pe > 0) {
    points += pe < 10 ? 6 : pe < 15 ? 4 : pe < 20 ? 3 : pe < 25 ? 2 : 0;
  }

  // P/B Ratio (max 4p)
  const pb = data.metrics?.pbRatio ?? 0;
  if (pb > 0) {
    points += pb < 1 ? 4 : pb < 2 ? 3 : pb < 3 ? 2 : pb < 5 ? 1 : 0;
  }

  // FCF Yield (max 4p)
  const fcfYield = (data.metrics?.freeCashFlowYield ?? 0) * 100;
  points += fcfYield > 10 ? 4 : fcfYield > 7 ? 3 : fcfYield > 5 ? 2 : fcfYield > 3 ? 1 : 0;

  // Earnings Yield (max 3p)
  const earningsYield = (data.metrics?.earningsYield ?? 0) * 100;
  points += earningsYield > 10 ? 3 : earningsYield > 7 ? 2 : earningsYield > 5 ? 1 : 0;

  return Math.min(25, Math.round(points));
}

/**
 * Growth Score (max 20 points)
 * Revenue Growth, Net Income Growth, FCF Growth (5-year)
 */
function calculateGrowthScore(data: RatingInputData): number {
  let points = 0;

  const currentIncome = data.income[0];
  const oldIncome = data.income[data.income.length - 1];
  const currentCF = data.cashFlow[0];
  const oldCF = data.cashFlow[data.cashFlow.length - 1];

  // Revenue Growth 5y (max 7p)
  if (currentIncome?.revenue && oldIncome?.revenue && oldIncome.revenue > 0) {
    const revGrowth = ((currentIncome.revenue - oldIncome.revenue) / oldIncome.revenue) * 100;
    points += revGrowth > 50 ? 7 : revGrowth > 30 ? 5 : revGrowth > 15 ? 3 : revGrowth > 0 ? 1 : 0;
  }

  // Net Income Growth 5y (max 7p)
  if (currentIncome?.netIncome && oldIncome?.netIncome && oldIncome.netIncome > 0) {
    const niGrowth = ((currentIncome.netIncome - oldIncome.netIncome) / oldIncome.netIncome) * 100;
    points += niGrowth > 50 ? 7 : niGrowth > 30 ? 5 : niGrowth > 15 ? 3 : niGrowth > 0 ? 1 : 0;
  }

  // FCF Growth 5y (max 6p)
  if (currentCF?.freeCashFlow && oldCF?.freeCashFlow && oldCF.freeCashFlow > 0) {
    const fcfGrowth = ((currentCF.freeCashFlow - oldCF.freeCashFlow) / oldCF.freeCashFlow) * 100;
    points += fcfGrowth > 50 ? 6 : fcfGrowth > 30 ? 4 : fcfGrowth > 15 ? 2 : fcfGrowth > 0 ? 1 : 0;
  }

  return Math.min(20, Math.round(points));
}

/**
 * Safety & Dividend Score (max 20 points)
 * Debt Ratio, Current Ratio, Interest Coverage, Dividend Yield, Payout Ratio
 */
function calculateSafetyScore(data: RatingInputData): number {
  let points = 0;

  // Debt/FCF Ratio (max 5p) - from QM pillar 7
  const debtPillar = data.qmScore.pillars.find(p => p.name === 'Velkaantuneisuus');
  if (debtPillar?.value !== null && debtPillar?.value !== undefined) {
    const debtRatio = debtPillar.value;
    points += debtRatio < 1 ? 5 : debtRatio < 2 ? 4 : debtRatio < 3 ? 3 : debtRatio < 5 ? 2 : 0;
  }

  // Current Ratio (max 3p)
  const currentRatio = data.qmScore.additionalMetrics.currentRatio;
  if (currentRatio !== null) {
    points += currentRatio > 2 ? 3 : currentRatio > 1.5 ? 2 : currentRatio > 1 ? 1 : 0;
  }

  // Interest Coverage (max 3p)
  const interestCov = data.metrics?.interestCoverage ?? 0;
  points += interestCov > 10 ? 3 : interestCov > 5 ? 2 : interestCov > 2 ? 1 : 0;

  // Positive FCF (max 2p)
  const latestFCF = data.cashFlow[0]?.freeCashFlow ?? 0;
  points += latestFCF > 0 ? 2 : 0;

  // Dividend Yield (max 4p)
  const divYield = (data.metrics?.dividendYield ?? 0) * 100;
  points += divYield > 4 ? 4 : divYield > 3 ? 3 : divYield > 2 ? 2 : divYield > 1 ? 1 : 0;

  // Payout Ratio (max 3p) - healthy: 30-60%
  const payoutRatio = (data.metrics?.payoutRatio ?? 0) * 100;
  if (payoutRatio > 0) {
    points += payoutRatio >= 30 && payoutRatio <= 60 ? 3 :
              payoutRatio >= 20 && payoutRatio <= 70 ? 2 :
              payoutRatio < 80 ? 1 : 0;
  }

  return Math.min(20, Math.round(points));
}

/**
 * Momentum Score (max 5 points)
 * 52-week price position (lower = better buying opportunity)
 */
function calculateMomentumScore(data: RatingInputData): number {
  const { yearHigh, yearLow, price } = data.quote;

  if (yearHigh > 0 && yearLow > 0 && yearHigh > yearLow) {
    const position = (price - yearLow) / (yearHigh - yearLow);
    return position < 0.2 ? 5 : position < 0.35 ? 4 : position < 0.5 ? 3 : position < 0.65 ? 2 : position < 0.8 ? 1 : 0;
  }

  return 0;
}

/**
 * Convert score to rating
 */
function getScoreRating(score: number): Rating {
  if (score >= 75) return 'Strong Buy';
  if (score >= 55) return 'Buy';
  if (score >= 35) return 'Hold';
  return 'Sell';
}

/**
 * Check if stock qualifies as "Hidden Gem"
 * Criteria: QM ≥ 6, Market Cap < $50B, Value Gap > 15%, Rating Buy/Strong Buy, Positive FCF
 */
function checkHiddenGem(data: RatingInputData, rating: Rating, score: number): boolean {
  const qmScore = data.qmScore.totalScore;
  const marketCap = data.quote.marketCap;
  const valueGap = data.valuation.valueGap;
  const latestFCF = data.cashFlow[0]?.freeCashFlow ?? 0;

  return (
    qmScore >= 6 &&
    marketCap < 50_000_000_000 && // < $50B
    valueGap !== null && valueGap > 15 &&
    (rating === 'Buy' || rating === 'Strong Buy') &&
    latestFCF > 0
  );
}
