/**
 * Database access for Crown Jewels data
 *
 * Uses Turso (libSQL) for cloud deployment
 */

import { createClient } from '@libsql/client';

export interface CrownJewelRow {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market_cap_b: number;
  price: number;
  qm_score: number;
  pe5y_passes: number;
  roic5y_passes: number;
  shares_decreasing_passes: number;
  fcf_growing_passes: number;
  income_growing_passes: number;
  revenue_growing_passes: number;
  debt_low_passes: number;
  pfcf5y_passes: number;
  current_pe: number | null;
  pe5y: number | null;
  pfcf5y: number | null;
  fair_pe: number;
  value_gap_percent: number | null;
  roic5y_percent: number | null;
  operating_margin_percent: number | null;
  gross_margin_percent: number | null;
  roe_percent: number | null;
  revenue_growth_5y_percent: number | null;
  income_growth_5y_percent: number | null;
  fcf_growth_5y_percent: number | null;
  shares_change_5y_percent: number | null;
  debt_to_fcf_ratio: number | null;
  fcf_yield_percent: number | null;
  tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver' | null;
  confidence_score: number;
  growth_signals: number;
  scanned_at: string;
}

export interface ProcessedCrownJewel {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCapB: number;
  price: number;
  qmScore: number;
  tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver';
  baseScore: number;
  adjustedScore: number;
  macroBonus: number;
  valueGapPercent: number;
  roic5yPercent: number;
  fcfYieldPercent: number;
  revenueGrowth5yPercent: number | null;
  incomeGrowth5yPercent: number | null;
  sharesChange5yPercent: number | null;
  hasBuybacks: boolean;
  scannedAt: string;
}

// Create database client - uses Turso in production, local file in development
function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:./data/stocks.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function calculateBaseScore(row: CrownJewelRow): number {
  let score = 0;

  // QM Score contributes 0-40 points
  score += (row.qm_score / 8) * 40;

  // Value Gap contributes 0-30 points
  const valueGap = row.value_gap_percent || 0;
  score += Math.min(valueGap / 100, 1) * 30;

  // Growth signals contribute 0-15 points
  score += (row.growth_signals / 3) * 15;

  // Quality metrics contribute 0-15 points
  const roic = row.roic5y_percent || 0;
  if (roic > 30) score += 15;
  else if (roic > 20) score += 10;
  else if (roic > 10) score += 5;

  return Math.round(score);
}

export async function getAllCrownJewelsFromDB(): Promise<ProcessedCrownJewel[]> {
  const db = getClient();

  try {
    const result = await db.execute(`
      SELECT * FROM crown_jewels
      WHERE tier IS NOT NULL
      ORDER BY confidence_score DESC
    `);

    return (result.rows as unknown as CrownJewelRow[]).map(row => {
      const baseScore = calculateBaseScore(row);
      return {
        symbol: row.symbol,
        name: row.name,
        sector: row.sector,
        industry: row.industry,
        marketCapB: row.market_cap_b,
        price: row.price,
        qmScore: row.qm_score,
        tier: row.tier!,
        baseScore,
        adjustedScore: baseScore, // Will be adjusted by macro analyzer
        macroBonus: 0,
        valueGapPercent: row.value_gap_percent || 0,
        roic5yPercent: row.roic5y_percent || 0,
        fcfYieldPercent: row.fcf_yield_percent || 0,
        revenueGrowth5yPercent: row.revenue_growth_5y_percent,
        incomeGrowth5yPercent: row.income_growth_5y_percent,
        sharesChange5yPercent: row.shares_change_5y_percent,
        hasBuybacks: (row.shares_change_5y_percent || 0) < 0,
        scannedAt: row.scanned_at,
      };
    });
  } catch (error) {
    console.error('Error fetching crown jewels:', error);
    return [];
  }
}

export async function getDBStats(): Promise<{
  totalScanned: number;
  lastScan: string | null;
  crownJewelCount: number;
  diamondCount: number;
  goldCount: number;
  silverCount: number;
}> {
  const db = getClient();

  try {
    const [total, lastScan, tiers] = await Promise.all([
      db.execute('SELECT COUNT(*) as count FROM crown_jewels'),
      db.execute('SELECT MAX(scanned_at) as last_scan FROM crown_jewels'),
      db.execute(`
        SELECT tier, COUNT(*) as count
        FROM crown_jewels
        WHERE tier IS NOT NULL
        GROUP BY tier
      `),
    ]);

    const tierCounts: Record<string, number> = {};
    for (const row of tiers.rows as unknown as { tier: string; count: number }[]) {
      tierCounts[row.tier] = row.count;
    }

    return {
      totalScanned: (total.rows[0] as any)?.count || 0,
      lastScan: (lastScan.rows[0] as any)?.last_scan || null,
      crownJewelCount: tierCounts['crown-jewel'] || 0,
      diamondCount: tierCounts['diamond'] || 0,
      goldCount: tierCounts['gold'] || 0,
      silverCount: tierCounts['silver'] || 0,
    };
  } catch (error) {
    console.error('Error fetching DB stats:', error);
    return {
      totalScanned: 0,
      lastScan: null,
      crownJewelCount: 0,
      diamondCount: 0,
      goldCount: 0,
      silverCount: 0,
    };
  }
}
