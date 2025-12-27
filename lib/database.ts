/**
 * Database access for Crown Jewels data
 *
 * Reads from SQLite database for real-time stock data
 */

import Database from 'better-sqlite3';
import path from 'path';

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

let dbInstance: Database.Database | null = null;

function getDatabase(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.join(process.cwd(), 'data', 'stocks.db');
    dbInstance = new Database(dbPath, { readonly: true });
  }
  return dbInstance;
}

export function getAllCrownJewelsFromDB(): ProcessedCrownJewel[] {
  const db = getDatabase();

  // Check if table exists
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='crown_jewels'
  `).get();

  if (!tableExists) {
    console.log('crown_jewels table does not exist yet');
    return [];
  }

  const rows = db.prepare(`
    SELECT * FROM crown_jewels
    WHERE tier IS NOT NULL
    ORDER BY confidence_score DESC
  `).all() as CrownJewelRow[];

  return rows.map(row => ({
    symbol: row.symbol,
    name: row.name,
    sector: row.sector,
    industry: row.industry,
    marketCapB: row.market_cap_b,
    price: row.price,
    qmScore: row.qm_score,
    tier: row.tier as 'crown-jewel' | 'diamond' | 'gold' | 'silver',
    baseScore: row.confidence_score,
    adjustedScore: row.confidence_score, // Will be adjusted by macro
    macroBonus: 0, // Will be calculated
    valueGapPercent: row.value_gap_percent || 0,
    roic5yPercent: row.roic5y_percent || 0,
    fcfYieldPercent: row.fcf_yield_percent || 0,
    revenueGrowth5yPercent: row.revenue_growth_5y_percent,
    incomeGrowth5yPercent: row.income_growth_5y_percent,
    sharesChange5yPercent: row.shares_change_5y_percent,
    hasBuybacks: (row.shares_change_5y_percent || 0) < 0,
    scannedAt: row.scanned_at,
  }));
}

export function getCrownJewelBySymbol(symbol: string): ProcessedCrownJewel | null {
  const db = getDatabase();

  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='crown_jewels'
  `).get();

  if (!tableExists) {
    return null;
  }

  const row = db.prepare(`
    SELECT * FROM crown_jewels WHERE symbol = ?
  `).get(symbol) as CrownJewelRow | undefined;

  if (!row) return null;

  return {
    symbol: row.symbol,
    name: row.name,
    sector: row.sector,
    industry: row.industry,
    marketCapB: row.market_cap_b,
    price: row.price,
    qmScore: row.qm_score,
    tier: row.tier as 'crown-jewel' | 'diamond' | 'gold' | 'silver',
    baseScore: row.confidence_score,
    adjustedScore: row.confidence_score,
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
}

export function getDBStats(): {
  totalScanned: number;
  crownJewelCount: number;
  diamondCount: number;
  goldCount: number;
  silverCount: number;
  lastScan: string | null;
} {
  const db = getDatabase();

  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='crown_jewels'
  `).get();

  if (!tableExists) {
    return {
      totalScanned: 0,
      crownJewelCount: 0,
      diamondCount: 0,
      goldCount: 0,
      silverCount: 0,
      lastScan: null,
    };
  }

  const total = db.prepare('SELECT COUNT(*) as count FROM crown_jewels').get() as { count: number };
  const tierCounts = db.prepare(`
    SELECT tier, COUNT(*) as count
    FROM crown_jewels
    WHERE tier IS NOT NULL
    GROUP BY tier
  `).all() as { tier: string; count: number }[];

  const lastScan = db.prepare(`
    SELECT MAX(scanned_at) as last FROM crown_jewels
  `).get() as { last: string | null };

  const counts: Record<string, number> = {};
  tierCounts.forEach(t => { counts[t.tier] = t.count; });

  return {
    totalScanned: total.count,
    crownJewelCount: counts['crown-jewel'] || 0,
    diamondCount: counts['diamond'] || 0,
    goldCount: counts['gold'] || 0,
    silverCount: counts['silver'] || 0,
    lastScan: lastScan.last,
  };
}

export function getSectorBreakdown(): { sector: string; count: number; avgScore: number }[] {
  const db = getDatabase();

  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master WHERE type='table' AND name='crown_jewels'
  `).get();

  if (!tableExists) {
    return [];
  }

  return db.prepare(`
    SELECT
      sector,
      COUNT(*) as count,
      ROUND(AVG(confidence_score), 1) as avgScore
    FROM crown_jewels
    WHERE tier IS NOT NULL
    GROUP BY sector
    ORDER BY count DESC
  `).all() as { sector: string; count: number; avgScore: number }[];
}
