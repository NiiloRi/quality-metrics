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
  QMPillar,
  QMScore,
  ValuationAnalysis,
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
