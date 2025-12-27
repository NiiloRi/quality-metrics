/**
 * Investment Timeframe Scoring System
 *
 * Adjusts Hidden Gem / Crown Jewels ratings based on investment horizon:
 * - Short-term: Momentum/swing trading (days to weeks)
 * - Medium-term: Growth investing (months)
 * - Long-term: Buy & hold value investing (years) - DEFAULT
 */

export type InvestmentTimeframe = 'short-term' | 'medium-term' | 'long-term';

export interface TimeframeWeights {
  momentum: number;
  quality: number;
  value: number;
  growth: number;
  thresholds: {
    minQmScore: number;
    minValueGap: number;
    maxPE: number;
  };
}

export interface TimeframeGemCriteria {
  minQmScore: number;
  minValueGap: number;
  maxMarketCap: number;
  requireMomentum?: boolean;
  requireGrowth?: boolean;
  tierNames: {
    top: string;
    high: string;
    good?: string;
    fair?: string;
  };
}

/**
 * Scoring weights for each investment timeframe
 * Weights sum to 1.0 for normalized scoring
 */
export const TIMEFRAME_WEIGHTS: Record<InvestmentTimeframe, TimeframeWeights> = {
  'short-term': {
    // Swing trading / momentum - prioritizes price action
    momentum: 0.45,      // 52w position, recent price changes
    quality: 0.30,       // Basic QM quality
    value: 0.15,         // Valuation (less important)
    growth: 0.10,        // Growth metrics

    thresholds: {
      minQmScore: 4,       // Lower quality bar
      minValueGap: -20,    // Allows overvalued stocks
      maxPE: 60,           // Allows growth stocks
    }
  },

  'medium-term': {
    // Growth investing (3-12 months) - balanced approach
    quality: 0.40,
    growth: 0.30,
    value: 0.20,
    momentum: 0.10,

    thresholds: {
      minQmScore: 5,
      minValueGap: 0,
      maxPE: 40,
    }
  },

  'long-term': {
    // Buy & hold - current Crown Jewels model (DEFAULT)
    quality: 0.55,       // Highest quality requirement
    value: 0.25,         // Strong value focus
    growth: 0.15,        // Sustainable growth
    momentum: 0.05,      // Minimal momentum weight

    thresholds: {
      minQmScore: 6,       // High quality bar
      minValueGap: 15,     // Must be undervalued
      maxPE: 25,           // Conservative PE
    }
  }
};

/**
 * Hidden Gem criteria per timeframe
 * Different naming and thresholds for each strategy
 */
export const TIMEFRAME_GEM_CRITERIA: Record<InvestmentTimeframe, TimeframeGemCriteria> = {
  'short-term': {
    // Momentum gems - stocks with strong price action
    minQmScore: 4,
    minValueGap: -30,
    maxMarketCap: 100e9,
    requireMomentum: true,
    tierNames: {
      top: 'Momentum Pick',
      high: 'Swing Candidate',
    }
  },

  'medium-term': {
    // Growth gems - stocks with accelerating earnings
    minQmScore: 5,
    minValueGap: -10,
    maxMarketCap: 75e9,
    requireGrowth: true,
    tierNames: {
      top: 'Growth Star',
      high: 'Rising Pick',
    }
  },

  'long-term': {
    // Quality gems - current Hidden Gem model
    minQmScore: 6,
    minValueGap: 15,
    maxMarketCap: 50e9,
    tierNames: {
      top: 'Crown Jewel',
      high: 'Diamond',
      good: 'Gold',
      fair: 'Silver',
    }
  }
};

/**
 * UI labels for timeframe selector
 */
export const TIMEFRAME_LABELS: Record<InvestmentTimeframe, { label: string; description: string; icon: string }> = {
  'short-term': {
    label: 'Lyhyt',
    description: 'Päivät - viikot',
    icon: '🔥',
  },
  'medium-term': {
    label: 'Keskipitkä',
    description: 'Kuukaudet',
    icon: '📈',
  },
  'long-term': {
    label: 'Pitkä',
    description: 'Vuodet',
    icon: '💎',
  },
};

export const DEFAULT_TIMEFRAME: InvestmentTimeframe = 'long-term';

/**
 * Stock data interface for scoring
 */
export interface StockForScoring {
  qm_score: number;
  value_gap: number | null;
  pe_ratio: number | null;
  market_cap: number;
  // Data from data_json
  week52High?: number;
  week52Low?: number;
  price?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
  priceChange1M?: number;
  priceChange3M?: number;
}

/**
 * Normalize QM quality score (0-10) to 0-100
 */
function normalizeQuality(stock: StockForScoring): number {
  return Math.min(100, Math.max(0, stock.qm_score * 10));
}

/**
 * Normalize value gap to 0-100 score
 * Higher gap = more undervalued = higher score
 */
function normalizeValue(stock: StockForScoring): number {
  const valueGap = stock.value_gap ?? 0;
  // Value gap ranges from -100 (very overvalued) to +200 (very undervalued)
  // Map to 0-100 where 0% gap = 50, +100% gap = 100, -100% gap = 0
  return Math.min(100, Math.max(0, 50 + valueGap * 0.5));
}

/**
 * Normalize growth metrics to 0-100 score
 */
function normalizeGrowth(stock: StockForScoring): number {
  const revenueGrowth = stock.revenueGrowth ?? 0;
  const epsGrowth = stock.epsGrowth ?? 0;

  // Average of revenue and EPS growth
  const avgGrowth = (revenueGrowth + epsGrowth) / 2;

  // Map -20% to +50% growth to 0-100
  return Math.min(100, Math.max(0, (avgGrowth + 20) * (100 / 70)));
}

/**
 * Normalize momentum (52-week position + recent price changes) to 0-100 score
 */
function normalizeMomentum(stock: StockForScoring): number {
  let score = 50; // Default neutral

  // 52-week position score (0-50 points)
  if (stock.week52High && stock.week52Low && stock.price) {
    const range = stock.week52High - stock.week52Low;
    if (range > 0) {
      const position = (stock.price - stock.week52Low) / range;
      score = position * 50;
    }
  }

  // Recent price change bonus (0-50 points)
  const priceChange3M = stock.priceChange3M ?? 0;
  // Map -30% to +30% change to 0-50
  const changeScore = Math.min(50, Math.max(0, (priceChange3M + 30) * (50 / 60)));

  return Math.min(100, score + changeScore);
}

/**
 * Calculate timeframe-adjusted rating score
 * Returns 0-100 normalized score
 */
export function calculateTimeframeScore(
  stock: StockForScoring,
  timeframe: InvestmentTimeframe
): number {
  const weights = TIMEFRAME_WEIGHTS[timeframe];

  let score = 0;
  score += weights.quality * normalizeQuality(stock);
  score += weights.value * normalizeValue(stock);
  score += weights.growth * normalizeGrowth(stock);
  score += weights.momentum * normalizeMomentum(stock);

  return Math.round(score);
}

/**
 * Check if stock passes timeframe thresholds
 */
export function passesTimeframeThresholds(
  stock: StockForScoring,
  timeframe: InvestmentTimeframe
): boolean {
  const { thresholds } = TIMEFRAME_WEIGHTS[timeframe];

  if (stock.qm_score < thresholds.minQmScore) return false;
  if ((stock.value_gap ?? -100) < thresholds.minValueGap) return false;
  if (stock.pe_ratio && stock.pe_ratio > thresholds.maxPE) return false;

  return true;
}

/**
 * Get gem tier name based on score and timeframe
 */
export function getGemTier(
  stock: StockForScoring,
  timeframe: InvestmentTimeframe
): string | null {
  const criteria = TIMEFRAME_GEM_CRITERIA[timeframe];
  const tierNames = criteria.tierNames;

  // Check basic criteria
  if (stock.qm_score < criteria.minQmScore) return null;
  if ((stock.value_gap ?? -100) < criteria.minValueGap) return null;
  if (stock.market_cap > criteria.maxMarketCap) return null;

  // Calculate score for tier assignment
  const score = calculateTimeframeScore(stock, timeframe);

  // Tier thresholds
  if (score >= 80) return tierNames.top;
  if (score >= 65) return tierNames.high;
  if (score >= 50 && tierNames.good) return tierNames.good;
  if (score >= 35 && tierNames.fair) return tierNames.fair;

  return null;
}

/**
 * Convert score to rating string
 */
export function scoreToRating(score: number): 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' {
  if (score >= 75) return 'Strong Buy';
  if (score >= 55) return 'Buy';
  if (score >= 35) return 'Hold';
  return 'Sell';
}

/**
 * Calculate full rating with score and label
 */
export function calculateTimeframeRating(
  stock: StockForScoring,
  timeframe: InvestmentTimeframe
): { score: number; rating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell'; gemTier: string | null } {
  const score = calculateTimeframeScore(stock, timeframe);
  const rating = scoreToRating(score);
  const gemTier = passesTimeframeThresholds(stock, timeframe) ? getGemTier(stock, timeframe) : null;

  return { score, rating, gemTier };
}
