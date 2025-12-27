/**
 * Yahoo Finance API Client (v3)
 * Käytetään eurooppalaisille osakkeille (ilmainen vaihtoehto FMP:lle)
 */

import YahooFinance from 'yahoo-finance2';
import type {
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  KeyMetrics,
  Quote,
  CompanyProfile,
} from '@/types/stock';

// Initialize Yahoo Finance client (v3 API)
const yahooFinance = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

// Yahoo Finance v3 types - values are returned directly, not as {raw: number}
interface YahooQuoteSummary {
  assetProfile?: {
    industry?: string;
    sector?: string;
    country?: string;
    longBusinessSummary?: string;
    fullTimeEmployees?: number;
    companyOfficers?: { name?: string; title?: string }[];
    website?: string;
  };
  price?: {
    regularMarketPrice?: number;
    regularMarketChange?: number;
    regularMarketChangePercent?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    regularMarketVolume?: number;
    regularMarketOpen?: number;
    regularMarketPreviousClose?: number;
    marketCap?: number;
    currency?: string;
    shortName?: string;
    longName?: string;
    exchange?: string;
    exchangeName?: string;
  };
  summaryDetail?: {
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    fiftyDayAverage?: number;
    twoHundredDayAverage?: number;
    averageVolume?: number;
    trailingPE?: number;
    forwardPE?: number;
  };
  defaultKeyStatistics?: {
    priceToBook?: number;
    enterpriseToEbitda?: number;
    enterpriseToRevenue?: number;
    trailingEps?: number;
    forwardEps?: number;
    bookValue?: number;
    sharesOutstanding?: number;
    floatShares?: number;
  };
  financialData?: {
    currentRatio?: number;
    debtToEquity?: number;
    returnOnEquity?: number;
    returnOnAssets?: number;
    grossMargins?: number;
    operatingMargins?: number;
    profitMargins?: number;
    revenueGrowth?: number;
    earningsGrowth?: number;
    freeCashflow?: number;
    operatingCashflow?: number;
  };
  incomeStatementHistory?: {
    incomeStatementHistory?: YahooIncomeStatement[];
  };
  balanceSheetHistory?: {
    balanceSheetStatements?: YahooBalanceSheet[];
  };
  cashflowStatementHistory?: {
    cashflowStatements?: YahooCashFlow[];
  };
}

interface YahooIncomeStatement {
  endDate?: string;
  totalRevenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  dilutedEPS?: number;
}

interface YahooBalanceSheet {
  endDate?: string;
  totalAssets?: number;
  totalLiab?: number;
  totalStockholderEquity?: number;
  longTermDebt?: number;
  shortLongTermDebt?: number;
  commonStock?: number;
  totalCurrentAssets?: number;
  totalCurrentLiabilities?: number;
}

interface YahooCashFlow {
  endDate?: string;
  totalCashFromOperatingActivities?: number;
  capitalExpenditures?: number;
  dividendsPaid?: number;
}

// Helper to get value (handles both direct values and {raw: number} format)
function getValue(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object' && 'raw' in val) return (val as { raw: number }).raw || 0;
  return 0;
}

// Helper to get date string
function getDateString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'object' && 'fmt' in val) return (val as { fmt: string }).fmt || '';
  return '';
}

// Normalize Yahoo income statement to FMP format
function normalizeIncomeStatement(yahoo: YahooIncomeStatement, symbol: string): IncomeStatement {
  // Note: Yahoo doesn't provide weightedAverageShsOut per year
  // We calculate it from netIncome/EPS when possible
  const netIncome = getValue(yahoo.netIncome);
  const eps = getValue(yahoo.dilutedEPS);
  const estimatedShares = eps > 0 ? Math.round(netIncome / eps) : 0;

  return {
    date: getDateString(yahoo.endDate),
    symbol,
    revenue: getValue(yahoo.totalRevenue),
    grossProfit: getValue(yahoo.grossProfit),
    operatingIncome: getValue(yahoo.operatingIncome),
    netIncome,
    eps,
    weightedAverageShsOut: estimatedShares,
  };
}

// Normalize Yahoo balance sheet to FMP format
function normalizeBalanceSheet(yahoo: YahooBalanceSheet, symbol: string): BalanceSheet {
  const longTermDebt = getValue(yahoo.longTermDebt);
  const shortTermDebt = getValue(yahoo.shortLongTermDebt);
  return {
    date: getDateString(yahoo.endDate),
    symbol,
    totalAssets: getValue(yahoo.totalAssets),
    totalLiabilities: getValue(yahoo.totalLiab),
    totalStockholdersEquity: getValue(yahoo.totalStockholderEquity),
    totalDebt: longTermDebt + shortTermDebt,
    longTermDebt,
    shortTermDebt,
    commonStock: getValue(yahoo.commonStock),
    totalCurrentAssets: getValue(yahoo.totalCurrentAssets),
    totalCurrentLiabilities: getValue(yahoo.totalCurrentLiabilities),
  };
}

// Normalize Yahoo cash flow to FMP format
function normalizeCashFlow(yahoo: YahooCashFlow, symbol: string): CashFlowStatement {
  const operatingCashFlow = getValue(yahoo.totalCashFromOperatingActivities);
  const capex = Math.abs(getValue(yahoo.capitalExpenditures));
  return {
    date: getDateString(yahoo.endDate),
    symbol,
    operatingCashFlow,
    capitalExpenditure: -capex,
    freeCashFlow: operatingCashFlow - capex,
    dividendsPaid: getValue(yahoo.dividendsPaid),
  };
}

// Build Quote from Yahoo data
function buildQuote(summary: YahooQuoteSummary, symbol: string): Quote {
  const price = summary.price || {};
  const detail = summary.summaryDetail || {};
  const stats = summary.defaultKeyStatistics || {};

  return {
    symbol,
    name: price.longName || price.shortName || symbol,
    price: getValue(price.regularMarketPrice),
    changesPercentage: getValue(price.regularMarketChangePercent) * 100,
    change: getValue(price.regularMarketChange),
    dayLow: getValue(price.regularMarketDayLow),
    dayHigh: getValue(price.regularMarketDayHigh),
    yearHigh: getValue(detail.fiftyTwoWeekHigh),
    yearLow: getValue(detail.fiftyTwoWeekLow),
    marketCap: getValue(price.marketCap),
    priceAvg50: getValue(detail.fiftyDayAverage),
    priceAvg200: getValue(detail.twoHundredDayAverage),
    exchange: price.exchange || '',
    volume: getValue(price.regularMarketVolume),
    avgVolume: getValue(detail.averageVolume),
    open: getValue(price.regularMarketOpen),
    previousClose: getValue(price.regularMarketPreviousClose),
    eps: getValue(stats.trailingEps),
    pe: getValue(detail.trailingPE),
    sharesOutstanding: getValue(stats.sharesOutstanding),
  };
}

// Build CompanyProfile from Yahoo data
function buildProfile(summary: YahooQuoteSummary, symbol: string): CompanyProfile {
  const profile = summary.assetProfile || {};
  const price = summary.price || {};

  const ceo = profile.companyOfficers?.find(
    (o) => o.title?.toLowerCase().includes('ceo') || o.title?.toLowerCase().includes('chief executive')
  )?.name || '';

  return {
    symbol,
    companyName: price.longName || price.shortName || symbol,
    currency: price.currency || 'EUR',
    exchange: price.exchange || '',
    exchangeShortName: price.exchangeName || '',
    industry: profile.industry || '',
    sector: profile.sector || '',
    country: profile.country || '',
    description: profile.longBusinessSummary || '',
    ceo,
    fullTimeEmployees: String(profile.fullTimeEmployees || ''),
    website: profile.website || '',
    image: '',
    ipoDate: '',
  };
}

// Build KeyMetrics from Yahoo data
function buildKeyMetrics(summary: YahooQuoteSummary, symbol: string): KeyMetrics {
  const stats = summary.defaultKeyStatistics || {};
  const financial = summary.financialData || {};
  const detail = summary.summaryDetail || {};

  const trailingPE = getValue(detail.trailingPE);

  return {
    date: new Date().toISOString().split('T')[0],
    symbol,
    revenuePerShare: 0,
    netIncomePerShare: getValue(stats.trailingEps),
    operatingCashFlowPerShare: 0,
    freeCashFlowPerShare: 0,
    cashPerShare: 0,
    bookValuePerShare: getValue(stats.bookValue),
    peRatio: trailingPE,
    priceToSalesRatio: 0,
    pbRatio: getValue(stats.priceToBook),
    evToEbitda: getValue(stats.enterpriseToEbitda),
    evToOperatingCashFlow: 0,
    evToFreeCashFlow: 0,
    earningsYield: trailingPE > 0 ? 1 / trailingPE : 0,
    freeCashFlowYield: 0,
    debtToEquity: getValue(financial.debtToEquity),
    debtToAssets: 0,
    netDebtToEBITDA: 0,
    currentRatio: getValue(financial.currentRatio),
    interestCoverage: 0,
    incomeQuality: 0,
    dividendYield: 0,
    payoutRatio: 0,
    salesGeneralAndAdministrativeToRevenue: 0,
    researchAndDevelopementToRevenue: 0,
    intangiblesToTotalAssets: 0,
    capexToOperatingCashFlow: 0,
    capexToRevenue: 0,
    capexToDepreciation: 0,
    stockBasedCompensationToRevenue: 0,
    grahamNumber: 0,
    roic: 0,
    returnOnTangibleAssets: 0,
    grahamNetNet: 0,
    workingCapital: 0,
    tangibleAssetValue: 0,
    netCurrentAssetValue: 0,
    investedCapital: 0,
    averageReceivables: 0,
    averagePayables: 0,
    averageInventory: 0,
    daysSalesOutstanding: 0,
    daysPayablesOutstanding: 0,
    daysOfInventoryOnHand: 0,
    receivablesTurnover: 0,
    payablesTurnover: 0,
    inventoryTurnover: 0,
    roe: getValue(financial.returnOnEquity) * 100,
    capexPerShare: 0,
  };
}

export interface YahooStockData {
  profile: CompanyProfile | null;
  quote: Quote | null;
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashFlow: CashFlowStatement[];
  metrics: KeyMetrics[];
}

export async function getYahooStockData(symbol: string): Promise<YahooStockData> {
  try {
    const summary = await yahooFinance.quoteSummary(symbol, {
      modules: [
        'assetProfile',
        'price',
        'summaryDetail',
        'defaultKeyStatistics',
        'financialData',
        'incomeStatementHistory',
        'balanceSheetHistory',
        'cashflowStatementHistory',
      ],
    }) as YahooQuoteSummary;

    const profile = buildProfile(summary, symbol);
    const quote = buildQuote(summary, symbol);

    // Normalize financial statements
    const incomeHistory = summary.incomeStatementHistory?.incomeStatementHistory || [];
    const balanceHistory = summary.balanceSheetHistory?.balanceSheetStatements || [];
    const cashFlowHistory = summary.cashflowStatementHistory?.cashflowStatements || [];

    const income = incomeHistory.map((i) => normalizeIncomeStatement(i, symbol));
    const balance = balanceHistory.map((b) => normalizeBalanceSheet(b, symbol));
    const cashFlow = cashFlowHistory.map((c) => normalizeCashFlow(c, symbol));

    // Build metrics from available data
    const metrics = [buildKeyMetrics(summary, symbol)];

    return {
      profile,
      quote,
      income,
      balance,
      cashFlow,
      metrics,
    };
  } catch (error) {
    console.error(`Yahoo Finance error for ${symbol}:`, error);
    return {
      profile: null,
      quote: null,
      income: [],
      balance: [],
      cashFlow: [],
      metrics: [],
    };
  }
}
