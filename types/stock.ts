// FMP API Response Types

export interface IncomeStatement {
  date: string;
  symbol: string;
  revenue: number;
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  eps: number;
  weightedAverageShsOut: number;  // Shares outstanding for year
}

export interface BalanceSheet {
  date: string;
  symbol: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalDebt: number;
  longTermDebt: number;
  shortTermDebt: number;
  commonStock: number;
  totalCurrentAssets: number;
  totalCurrentLiabilities: number;
}

export interface CashFlowStatement {
  date: string;
  symbol: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
}

export interface KeyMetrics {
  date: string;
  symbol: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  peRatio: number;
  priceToSalesRatio: number;
  pbRatio: number;
  evToEbitda: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDevelopementToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  sharesOutstanding: number;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  currency: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  sector: string;
  country: string;
  description: string;
  ceo: string;
  fullTimeEmployees: string;
  website: string;
  image: string;
  ipoDate: string;
}

// QM Calculation Types

export interface QMPillar {
  name: string;
  description: string;
  value: number | null;
  threshold: string;
  passed: boolean;
  score: 0 | 1;
}

export interface QMScore {
  symbol: string;
  totalScore: number;
  maxScore: number;
  pillars: QMPillar[];
  additionalMetrics: {
    roe: number | null;
    grossMargin: number | null;
    operatingMargin: number | null;
    currentRatio: number | null;
  };
}

export interface ValuationAnalysis {
  symbol: string;
  qmScore: number;
  fairPE: number;
  currentPE: number | null;
  valueGap: number | null;
  status: 'undervalued' | 'fair' | 'overvalued' | 'unknown';
  statusText: string;
}

export interface StockAnalysis {
  profile: CompanyProfile;
  quote: Quote;
  qmScore: QMScore;
  valuation: ValuationAnalysis;
  historicalData: {
    income: IncomeStatement[];
    balance: BalanceSheet[];
    cashFlow: CashFlowStatement[];
    metrics: KeyMetrics[];
  };
}

// Rating System Types

export type Rating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';

export interface RatingBreakdown {
  quality: number;    // max 30
  value: number;      // max 25
  growth: number;     // max 20
  safety: number;     // max 20
  momentum: number;   // max 5
}

export interface RatingAnalysis {
  score: number;           // 0-100
  rating: Rating;
  isHiddenGem: boolean;
  breakdown: RatingBreakdown;
}
