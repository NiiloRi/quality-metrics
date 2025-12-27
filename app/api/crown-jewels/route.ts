/**
 * Crown Jewels API
 *
 * GET /api/crown-jewels - Hae kaikki Crown Jewels makro-adjusted rankingilla
 * GET /api/crown-jewels?sector=Technology - Filtteröi sektorilla
 * GET /api/crown-jewels?tier=diamond - Filtteröi tierillä
 * GET /api/crown-jewels?source=db - Käytä vain tietokantaa
 */

import { NextResponse } from 'next/server';
import {
  STOCK_DATABASE,
  getAllCrownJewelsRanked,
  type CrownJewelStock,
} from '@/lib/crown-jewel-prompt';
import {
  CURRENT_MACRO_ENVIRONMENT,
  calculateSectorMacroScore,
  calculateMacroAdjustedScore,
  SECTOR_CYCLE_PROFILES,
} from '@/lib/macro-analyzer';
import {
  getAllCrownJewelsFromDB,
  getDBStats,
  type ProcessedCrownJewel,
} from '@/lib/database';

interface CombinedStock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCapB: number;
  tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver';
  baseScore: number;
  adjustedScore: number;
  macroBonus: number;
  qmScore: number;
  valueGapPercent: number;
  roic5yPercent: number;
  fcfYieldPercent: number;
  revenueGrowth5yPercent: number | null;
  incomeGrowth5yPercent: number | null;
  sharesChange5yPercent: number | null;
  hasBuybacks: boolean;
  source: 'db' | 'hardcoded';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector');
    const tier = searchParams.get('tier');
    const limit = parseInt(searchParams.get('limit') || '100');
    const source = searchParams.get('source') || 'combined'; // 'db', 'hardcoded', 'combined'

    let stocks: CombinedStock[] = [];

    // Get database stocks
    if (source === 'db' || source === 'combined') {
      try {
        const dbStocks = getAllCrownJewelsFromDB();
        stocks = dbStocks.map(s => {
          // Calculate macro-adjusted score
          const macroResult = calculateMacroAdjustedScore(
            s.baseScore,
            s.sector,
            CURRENT_MACRO_ENVIRONMENT
          );

          return {
            symbol: s.symbol,
            name: s.name,
            sector: s.sector,
            industry: s.industry,
            marketCapB: s.marketCapB,
            tier: s.tier,
            baseScore: s.baseScore,
            adjustedScore: macroResult.adjustedScore,
            macroBonus: macroResult.macroBonus,
            qmScore: s.qmScore,
            valueGapPercent: s.valueGapPercent,
            roic5yPercent: s.roic5yPercent,
            fcfYieldPercent: s.fcfYieldPercent,
            revenueGrowth5yPercent: s.revenueGrowth5yPercent,
            incomeGrowth5yPercent: s.incomeGrowth5yPercent,
            sharesChange5yPercent: s.sharesChange5yPercent,
            hasBuybacks: s.hasBuybacks,
            source: 'db' as const,
          };
        });
      } catch (dbError) {
        console.log('Database not available, falling back to hardcoded:', dbError);
      }
    }

    // Merge with hardcoded data if combined or if db is empty
    if (source === 'hardcoded' || (source === 'combined' && stocks.length === 0)) {
      const hardcodedStocks = getAllCrownJewelsRanked();
      const existingSymbols = new Set(stocks.map(s => s.symbol));

      for (const s of hardcodedStocks) {
        if (!existingSymbols.has(s.symbol)) {
          stocks.push({
            symbol: s.symbol,
            name: s.name,
            sector: s.sector,
            industry: s.industry,
            marketCapB: s.marketCapB,
            tier: s.tier,
            baseScore: s.baseScore,
            adjustedScore: s.adjustedScore,
            macroBonus: s.macroBonus,
            qmScore: s.qmScore,
            valueGapPercent: s.valueGapPercent,
            roic5yPercent: s.roic5yPercent,
            fcfYieldPercent: s.fcfYieldPercent,
            revenueGrowth5yPercent: s.revenueGrowth5yPercent,
            incomeGrowth5yPercent: s.incomeGrowth5yPercent,
            sharesChange5yPercent: s.sharesChange5yPercent,
            hasBuybacks: s.sharesChange5yPercent < 0,
            source: 'hardcoded' as const,
          });
        }
      }
    }

    // Sort by adjusted score
    stocks.sort((a, b) => b.adjustedScore - a.adjustedScore);

    // Filter by sector
    if (sector) {
      stocks = stocks.filter(s => s.sector.toLowerCase() === sector.toLowerCase());
    }

    // Filter by tier
    if (tier) {
      stocks = stocks.filter(s => s.tier === tier);
    }

    // Limit results
    stocks = stocks.slice(0, limit);

    // Calculate sector stats
    const sectorStats = Object.keys(SECTOR_CYCLE_PROFILES).map(sectorName => {
      const macro = calculateSectorMacroScore(sectorName, CURRENT_MACRO_ENVIRONMENT);
      return {
        sector: sectorName,
        score: macro.score,
        outlook: macro.outlook,
        reasoning: macro.reasoning,
      };
    }).sort((a, b) => b.score - a.score);

    // Get DB stats
    const dbStats = getDBStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),

      // Makroympäristö
      macroEnvironment: {
        phase: CURRENT_MACRO_ENVIRONMENT.phase,
        liquidity: CURRENT_MACRO_ENVIRONMENT.liquidity,
        sentiment: CURRENT_MACRO_ENVIRONMENT.sentiment,
        fedFundsRate: CURRENT_MACRO_ENVIRONMENT.fedFundsRate,
        inflation: CURRENT_MACRO_ENVIRONMENT.inflation,
        vix: CURRENT_MACRO_ENVIRONMENT.vix,
        lastUpdated: CURRENT_MACRO_ENVIRONMENT.lastUpdated,
      },

      // Sektorit
      sectorRankings: sectorStats,

      // Database stats
      database: {
        totalScanned: dbStats.totalScanned,
        lastScan: dbStats.lastScan,
      },

      // Crown Jewels
      totalCount: stocks.length,
      crownJewels: stocks.map(s => ({
        symbol: s.symbol,
        name: s.name,
        sector: s.sector,
        industry: s.industry,
        marketCapB: s.marketCapB,

        // Pisteet
        tier: s.tier,
        tierIcon: s.tier === 'crown-jewel' ? '👑' : s.tier === 'diamond' ? '💎' : s.tier === 'gold' ? '🥇' : '🥈',
        baseScore: s.baseScore,
        adjustedScore: s.adjustedScore,
        macroBonus: s.macroBonus,

        // Metriikat
        qmScore: s.qmScore,
        valueGapPercent: s.valueGapPercent,
        roic5yPercent: s.roic5yPercent,
        fcfYieldPercent: s.fcfYieldPercent,

        // Kasvu
        revenueGrowth5yPercent: s.revenueGrowth5yPercent,
        incomeGrowth5yPercent: s.incomeGrowth5yPercent,

        // Pääoman allokaatio
        sharesChange5yPercent: s.sharesChange5yPercent,
        hasBuybacks: s.hasBuybacks,

        // Source
        source: s.source,
      })),

      // Yhteenveto
      summary: {
        crownJewelCount: stocks.filter(s => s.tier === 'crown-jewel').length,
        diamondCount: stocks.filter(s => s.tier === 'diamond').length,
        goldCount: stocks.filter(s => s.tier === 'gold').length,
        silverCount: stocks.filter(s => s.tier === 'silver').length,
        topSector: sectorStats[0]?.sector || 'N/A',
        averageValueGap: stocks.length > 0
          ? Math.round(stocks.reduce((sum, s) => sum + s.valueGapPercent, 0) / stocks.length)
          : 0,
        dbScanned: dbStats.totalScanned,
        dbHiddenGems: dbStats.crownJewelCount + dbStats.diamondCount + dbStats.goldCount + dbStats.silverCount,
      },
    });
  } catch (error) {
    console.error('Crown Jewels API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
