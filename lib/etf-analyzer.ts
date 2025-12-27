/**
 * ETF Analyzer
 *
 * Finds the best ETFs based on Crown Jewels overlap
 * Uses FMP ETF Stock Exposure API when available
 */

import { isDemoMode } from './demo-data';
import { DEMO_ETF_DATABASE, DEMO_ETF_HOLDINGS } from './etf-demo-data';

// Feature flag - enable when ETF data is available from FMP
export const ETF_FEATURE_ENABLED = process.env.NEXT_PUBLIC_ETF_ENABLED === 'true' || isDemoMode();

export interface ETFInfo {
  symbol: string;
  name: string;
  expenseRatio: number; // As percentage (e.g., 0.06 for 0.06%)
  aum: number; // Assets under management in billions
  category: string;
  holdings: number; // Total number of holdings
}

export interface ETFHolding {
  etfSymbol: string;
  stockSymbol: string;
  weight: number; // As percentage
  shares: number;
}

export interface StockETFExposure {
  stockSymbol: string;
  etfs: {
    symbol: string;
    name: string;
    weight: number;
  }[];
}

export interface ETFMatch {
  etf: ETFInfo;
  matchedStocks: {
    symbol: string;
    name: string;
    weight: number;
  }[];
  totalCrownJewels: number;
  totalWeight: number; // Combined weight of Crown Jewels in this ETF
  score: number; // Calculated score based on overlap and costs
}

export interface ETFFinderResult {
  success: boolean;
  inputStocks: string[];
  matches: ETFMatch[];
  bestPick: ETFMatch | null;
  timestamp: string;
  demoMode: boolean;
}

/**
 * Calculate ETF score based on Crown Jewels overlap
 *
 * Formula:
 * - Crown Jewels count: 40% weight
 * - Total weight of Crown Jewels: 35% weight
 * - Low expense ratio: 15% weight
 * - AUM (liquidity): 10% weight
 */
function calculateETFScore(
  crownJewelCount: number,
  totalCrownJewels: number,
  totalWeight: number,
  expenseRatio: number,
  aum: number
): number {
  // Normalize values
  const coverageScore = (crownJewelCount / totalCrownJewels) * 100; // 0-100
  const weightScore = Math.min(totalWeight * 2, 100); // Cap at 100, 50% weight = 100 score
  const expenseScore = Math.max(0, 100 - expenseRatio * 500); // 0.2% = 0, 0% = 100
  const aumScore = Math.min(aum / 100 * 100, 100); // $100B+ = 100

  // Weighted average
  const score =
    coverageScore * 0.4 +
    weightScore * 0.35 +
    expenseScore * 0.15 +
    aumScore * 0.1;

  return Math.round(score);
}

/**
 * Find best ETFs for given Crown Jewels stocks
 */
export async function findBestETFs(
  crownJewelSymbols: string[],
  crownJewelNames: Record<string, string> = {},
  limit: number = 10
): Promise<ETFFinderResult> {
  if (!ETF_FEATURE_ENABLED) {
    return {
      success: false,
      inputStocks: crownJewelSymbols,
      matches: [],
      bestPick: null,
      timestamp: new Date().toISOString(),
      demoMode: false,
    };
  }

  // Use demo data or real FMP data
  if (isDemoMode()) {
    return findBestETFsDemo(crownJewelSymbols, crownJewelNames, limit);
  }

  // Real implementation using FMP API
  return findBestETFsFromFMP(crownJewelSymbols, crownJewelNames, limit);
}

/**
 * Demo implementation with hardcoded data
 */
function findBestETFsDemo(
  crownJewelSymbols: string[],
  crownJewelNames: Record<string, string>,
  limit: number
): ETFFinderResult {
  const etfMatches: Map<string, ETFMatch> = new Map();

  // For each Crown Jewel, find ETFs that hold it
  for (const symbol of crownJewelSymbols) {
    const holdings = DEMO_ETF_HOLDINGS.filter(h => h.stockSymbol === symbol);

    for (const holding of holdings) {
      const etfInfo = DEMO_ETF_DATABASE[holding.etfSymbol];
      if (!etfInfo) continue;

      if (!etfMatches.has(holding.etfSymbol)) {
        etfMatches.set(holding.etfSymbol, {
          etf: etfInfo,
          matchedStocks: [],
          totalCrownJewels: 0,
          totalWeight: 0,
          score: 0,
        });
      }

      const match = etfMatches.get(holding.etfSymbol)!;
      match.matchedStocks.push({
        symbol,
        name: crownJewelNames[symbol] || symbol,
        weight: holding.weight,
      });
      match.totalCrownJewels++;
      match.totalWeight += holding.weight;
    }
  }

  // Calculate scores and sort
  const matches = Array.from(etfMatches.values())
    .map(match => ({
      ...match,
      score: calculateETFScore(
        match.totalCrownJewels,
        crownJewelSymbols.length,
        match.totalWeight,
        match.etf.expenseRatio,
        match.etf.aum
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    success: true,
    inputStocks: crownJewelSymbols,
    matches,
    bestPick: matches[0] || null,
    timestamp: new Date().toISOString(),
    demoMode: true,
  };
}

/**
 * Real implementation using FMP API
 * Activated when ETF data is available
 */
async function findBestETFsFromFMP(
  crownJewelSymbols: string[],
  crownJewelNames: Record<string, string>,
  limit: number
): Promise<ETFFinderResult> {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    console.error('FMP_API_KEY not configured');
    return {
      success: false,
      inputStocks: crownJewelSymbols,
      matches: [],
      bestPick: null,
      timestamp: new Date().toISOString(),
      demoMode: false,
    };
  }

  try {
    const etfMatches: Map<string, ETFMatch> = new Map();

    // Fetch ETF exposure for each Crown Jewel stock
    for (const symbol of crownJewelSymbols) {
      try {
        // FMP ETF Stock Exposure endpoint
        const response = await fetch(
          `https://financialmodelingprep.com/api/v3/etf-stock-exposure/${symbol}?apikey=${apiKey}`
        );

        if (!response.ok) continue;

        const exposures = await response.json() as {
          etfSymbol: string;
          etfName: string;
          etfWeight: number;
          etfExpenseRatio: number;
          etfAum: number;
          etfHoldings: number;
        }[];

        for (const exposure of exposures) {
          if (!etfMatches.has(exposure.etfSymbol)) {
            etfMatches.set(exposure.etfSymbol, {
              etf: {
                symbol: exposure.etfSymbol,
                name: exposure.etfName,
                expenseRatio: exposure.etfExpenseRatio,
                aum: exposure.etfAum / 1e9, // Convert to billions
                category: 'Equity', // Could be fetched separately
                holdings: exposure.etfHoldings,
              },
              matchedStocks: [],
              totalCrownJewels: 0,
              totalWeight: 0,
              score: 0,
            });
          }

          const match = etfMatches.get(exposure.etfSymbol)!;
          match.matchedStocks.push({
            symbol,
            name: crownJewelNames[symbol] || symbol,
            weight: exposure.etfWeight,
          });
          match.totalCrownJewels++;
          match.totalWeight += exposure.etfWeight;
        }

        // Rate limiting - wait 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`Failed to fetch ETF exposure for ${symbol}:`, err);
      }
    }

    // Calculate scores and sort
    const matches = Array.from(etfMatches.values())
      .map(match => ({
        ...match,
        score: calculateETFScore(
          match.totalCrownJewels,
          crownJewelSymbols.length,
          match.totalWeight,
          match.etf.expenseRatio,
          match.etf.aum
        ),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      success: true,
      inputStocks: crownJewelSymbols,
      matches,
      bestPick: matches[0] || null,
      timestamp: new Date().toISOString(),
      demoMode: false,
    };
  } catch (error) {
    console.error('ETF Finder error:', error);
    return {
      success: false,
      inputStocks: crownJewelSymbols,
      matches: [],
      bestPick: null,
      timestamp: new Date().toISOString(),
      demoMode: false,
    };
  }
}

/**
 * Get ETF details by symbol
 */
export async function getETFDetails(symbol: string): Promise<ETFInfo | null> {
  if (isDemoMode()) {
    return DEMO_ETF_DATABASE[symbol] || null;
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/etf-info/${symbol}?apikey=${apiKey}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (!data || data.length === 0) return null;

    const etf = data[0];
    return {
      symbol: etf.symbol,
      name: etf.name,
      expenseRatio: etf.expenseRatio || 0,
      aum: (etf.aum || 0) / 1e9,
      category: etf.category || 'Equity',
      holdings: etf.holdingsCount || 0,
    };
  } catch (error) {
    console.error('Failed to fetch ETF details:', error);
    return null;
  }
}

/**
 * Get holdings of a specific ETF
 */
export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  if (isDemoMode()) {
    return DEMO_ETF_HOLDINGS.filter(h => h.etfSymbol === symbol);
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/api/v3/etf-holder/${symbol}?apikey=${apiKey}`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.map((h: any) => ({
      etfSymbol: symbol,
      stockSymbol: h.asset,
      weight: h.weightPercentage,
      shares: h.sharesNumber,
    }));
  } catch (error) {
    console.error('Failed to fetch ETF holdings:', error);
    return [];
  }
}
