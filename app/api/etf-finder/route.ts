/**
 * ETF Finder API
 *
 * POST /api/etf-finder - Find best ETFs for given Crown Jewels
 * GET /api/etf-finder?symbols=AAPL,MSFT,GOOGL - Find ETFs by symbols
 *
 * Returns ranked list of ETFs that contain the most Crown Jewels
 * with the highest combined weight
 */

import { NextResponse } from 'next/server';
import { auth, hasPremiumAccess } from '@/lib/auth';
import {
  findBestETFs,
  ETF_FEATURE_ENABLED,
  type ETFFinderResult,
} from '@/lib/etf-analyzer';
import { isDemoMode, DEMO_CROWN_JEWELS } from '@/lib/demo-data';
import { getDemoStockName } from '@/lib/etf-demo-data';

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.subscriptionTier || !hasPremiumAccess(session.user.subscriptionTier)) {
      return NextResponse.json(
        { success: false, error: 'Premium access required' },
        { status: 403 }
      );
    }

    // Check if ETF feature is enabled
    if (!ETF_FEATURE_ENABLED) {
      return NextResponse.json(
        {
          success: false,
          error: 'ETF analysis feature is not yet available',
          message: 'This feature will be enabled once ETF data access is configured',
        },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    const limit = parseInt(searchParams.get('limit') || '10');
    const useTopCrownJewels = searchParams.get('useTop') === 'true';

    let symbols: string[];
    let symbolNames: Record<string, string> = {};

    if (useTopCrownJewels || !symbolsParam) {
      // Use top Crown Jewels from demo data
      if (isDemoMode()) {
        const topJewels = DEMO_CROWN_JEWELS.slice(0, 10);
        symbols = topJewels.map(s => s.symbol);
        symbolNames = Object.fromEntries(topJewels.map(s => [s.symbol, s.name]));
      } else {
        // In production, would fetch from database
        return NextResponse.json(
          { success: false, error: 'Please provide symbols parameter' },
          { status: 400 }
        );
      }
    } else {
      symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
      // Get names for demo stocks
      if (isDemoMode()) {
        symbolNames = Object.fromEntries(symbols.map(s => [s, getDemoStockName(s)]));
      }
    }

    const result = await findBestETFs(symbols, symbolNames, limit);

    return NextResponse.json({
      ...result,
      featureEnabled: ETF_FEATURE_ENABLED,
      usage: {
        description: 'ETF Finder analyzes which ETFs contain the most of your selected Crown Jewels',
        scoring: {
          crownJewelCoverage: '40% weight - How many of your stocks are in the ETF',
          totalWeight: '35% weight - Combined weight of your stocks in the ETF',
          expenseRatio: '15% weight - Lower costs = higher score',
          aum: '10% weight - Larger funds = better liquidity',
        },
      },
    });
  } catch (error) {
    console.error('ETF Finder API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.subscriptionTier || !hasPremiumAccess(session.user.subscriptionTier)) {
      return NextResponse.json(
        { success: false, error: 'Premium access required' },
        { status: 403 }
      );
    }

    // Check if ETF feature is enabled
    if (!ETF_FEATURE_ENABLED) {
      return NextResponse.json(
        {
          success: false,
          error: 'ETF analysis feature is not yet available',
          message: 'This feature will be enabled once ETF data access is configured',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { symbols, names, limit = 10 } = body as {
      symbols: string[];
      names?: Record<string, string>;
      limit?: number;
    };

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { success: false, error: 'symbols array is required' },
        { status: 400 }
      );
    }

    if (symbols.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Maximum 20 symbols allowed' },
        { status: 400 }
      );
    }

    const result = await findBestETFs(
      symbols.map(s => s.toUpperCase()),
      names || {},
      Math.min(limit, 20)
    );

    return NextResponse.json({
      ...result,
      featureEnabled: ETF_FEATURE_ENABLED,
    });
  } catch (error) {
    console.error('ETF Finder API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
