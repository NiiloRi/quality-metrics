/**
 * Generate STOCK_DATABASE TypeScript code from SQLite database
 *
 * Reads crown_jewels table and outputs TypeScript code for hardcoding
 *
 * Usage: npx tsx scripts/generate-stock-database.ts
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

interface CrownJewelRow {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market_cap_b: number;
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
  tier: string;
  confidence_score: number;
}

function main() {
  const dbPath = path.join(__dirname, '..', 'data', 'stocks.db');
  const db = new Database(dbPath, { readonly: true });

  console.log('Reading crown_jewels from database...');

  const rows = db.prepare(`
    SELECT * FROM crown_jewels
    WHERE tier IS NOT NULL
    ORDER BY confidence_score DESC
  `).all() as CrownJewelRow[];

  console.log(`Found ${rows.length} Hidden Gems`);

  // Group by tier
  const crownJewels = rows.filter(r => r.tier === 'crown-jewel');
  const diamonds = rows.filter(r => r.tier === 'diamond');
  const golds = rows.filter(r => r.tier === 'gold');
  const silvers = rows.filter(r => r.tier === 'silver');

  console.log(`  Crown Jewels: ${crownJewels.length}`);
  console.log(`  Diamonds: ${diamonds.length}`);
  console.log(`  Golds: ${golds.length}`);
  console.log(`  Silvers: ${silvers.length}`);

  // Generate TypeScript code
  let code = `/**
 * STOCK_DATABASE - Auto-generated from SQLite database
 *
 * Generated: ${new Date().toISOString()}
 * Total Hidden Gems: ${rows.length}
 *   Crown Jewels: ${crownJewels.length}
 *   Diamonds: ${diamonds.length}
 *   Golds: ${golds.length}
 *   Silvers: ${silvers.length}
 */

import type { CrownJewelStock } from '@/lib/crown-jewel-prompt';

export const STOCK_DATABASE: Record<string, CrownJewelStock> = {
`;

  for (const row of rows) {
    code += `  '${row.symbol}': {
    symbol: '${row.symbol}',
    name: '${row.name.replace(/'/g, "\\'")}',
    sector: '${row.sector}',
    industry: '${row.industry.replace(/'/g, "\\'")}',
    marketCapB: ${row.market_cap_b},
    qmScore: ${row.qm_score},
    qmPillars: {
      pe5y: ${row.pe5y_passes === 1},
      roic5y: ${row.roic5y_passes === 1},
      sharesDecreasing: ${row.shares_decreasing_passes === 1},
      fcfGrowing: ${row.fcf_growing_passes === 1},
      incomeGrowing: ${row.income_growing_passes === 1},
      revenueGrowing: ${row.revenue_growing_passes === 1},
      debtLow: ${row.debt_low_passes === 1},
      pfcf5y: ${row.pfcf5y_passes === 1},
    },
    valueGapPercent: ${row.value_gap_percent ?? 0},
    currentPE: ${row.current_pe ?? 'null'},
    fairPE: ${row.fair_pe},
    roic5yPercent: ${row.roic5y_percent ?? 0},
    operatingMarginPercent: ${row.operating_margin_percent ?? 0},
    grossMarginPercent: ${row.gross_margin_percent ?? 0},
    roePercent: ${row.roe_percent ?? 'null'},
    revenueGrowth5yPercent: ${row.revenue_growth_5y_percent ?? 0},
    incomeGrowth5yPercent: ${row.income_growth_5y_percent ?? 0},
    fcfGrowth5yPercent: ${row.fcf_growth_5y_percent ?? 0},
    sharesChange5yPercent: ${row.shares_change_5y_percent ?? 0},
    debtToFcfRatio: ${row.debt_to_fcf_ratio ?? 0},
    fcfYieldPercent: ${row.fcf_yield_percent ?? 0},
    tier: '${row.tier}' as const,
    baseScore: ${row.confidence_score},
    lastUpdated: '${new Date().toISOString().split('T')[0]}',
  },
`;
  }

  code += `};
`;

  // Output to console
  console.log('\n=== GENERATED STOCK_DATABASE ===\n');
  console.log(code);

  // Also save to file
  const outputPath = path.join(__dirname, '..', 'data', 'stock-database-generated.ts');
  fs.writeFileSync(outputPath, code);
  console.log(`\nSaved to: ${outputPath}`);

  db.close();
}

main();
