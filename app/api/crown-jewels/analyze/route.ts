/**
 * Crown Jewel Deep Analysis API (Claude-powered)
 *
 * POST /api/crown-jewels/analyze
 * Body: { "symbol": "CROX" }
 *
 * Kutsuu Claude API:a syväanalyysiin (premium-ominaisuus)
 */

import { NextResponse } from 'next/server';
import { auth, hasPremiumAccess } from '@/lib/auth';
import Anthropic from '@anthropic-ai/sdk';
import {
  STOCK_DATABASE,
  generateSingleStockAnalysisPrompt,
  generateComparisonPrompt,
  generateTop5ReviewPrompt,
} from '@/lib/crown-jewel-prompt';

// Anthropic client
const anthropic = new Anthropic();

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

    const body = await request.json();
    const { symbol, type = 'single', symbols, model = 'claude-sonnet-4-20250514' } = body;

    // Validoi pyyntö
    if (type === 'single' && !symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbol required for single stock analysis' },
        { status: 400 }
      );
    }

    if (type === 'compare' && (!symbols || symbols.length !== 2)) {
      return NextResponse.json(
        { success: false, error: 'Two symbols required for comparison' },
        { status: 400 }
      );
    }

    // Generoi prompt
    let prompt = '';
    let analysisType = '';

    switch (type) {
      case 'single':
        const upperSymbol = symbol.toUpperCase();
        if (!STOCK_DATABASE[upperSymbol]) {
          return NextResponse.json(
            { success: false, error: `Stock ${upperSymbol} not in database` },
            { status: 404 }
          );
        }
        prompt = generateSingleStockAnalysisPrompt(upperSymbol);
        analysisType = `Single Stock Analysis: ${upperSymbol}`;
        break;

      case 'compare':
        const [s1, s2] = symbols.map((s: string) => s.toUpperCase());
        if (!STOCK_DATABASE[s1] || !STOCK_DATABASE[s2]) {
          return NextResponse.json(
            { success: false, error: 'One or both stocks not in database' },
            { status: 404 }
          );
        }
        prompt = generateComparisonPrompt(s1, s2);
        analysisType = `Comparison: ${s1} vs ${s2}`;
        break;

      case 'top5':
        prompt = generateTop5ReviewPrompt();
        analysisType = 'Top 5 Crown Jewels Review';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type. Use: single, compare, or top5' },
          { status: 400 }
        );
    }

    // Kutsu Claude API
    const startTime = Date.now();

    const message = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const endTime = Date.now();
    const processingTime = endTime - startTime;

    // Ota analyysi vastauksesta
    const analysisContent = message.content[0];
    const analysis = analysisContent.type === 'text' ? analysisContent.text : '';

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),

      // Meta
      meta: {
        analysisType,
        model,
        processingTimeMs: processingTime,
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },

      // Analyysi
      analysis,

      // Debug (vain kehityksessä)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          promptLength: prompt.length,
          stopReason: message.stop_reason,
        },
      }),
    });
  } catch (error: any) {
    console.error('Crown Jewel analyze API error:', error);

    // Anthropic-spesifiset virheet
    if (error.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET - Palauta käyttöohjeet
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    endpoint: '/api/crown-jewels/analyze',
    description: 'Claude-powered deep analysis for Crown Jewel stocks',
    usage: {
      singleStock: {
        method: 'POST',
        body: { symbol: 'CROX', type: 'single' },
        description: 'Deep analysis of a single Crown Jewel stock',
      },
      comparison: {
        method: 'POST',
        body: { symbols: ['CROX', 'ANF'], type: 'compare' },
        description: 'Compare two Crown Jewel stocks',
      },
      top5Review: {
        method: 'POST',
        body: { type: 'top5' },
        description: 'Monthly review of top 5 Crown Jewels',
      },
    },
    availableStocks: Object.keys(STOCK_DATABASE),
    models: [
      'claude-sonnet-4-20250514 (default)',
      'claude-opus-4-20250514',
      'claude-3-5-haiku-20241022',
    ],
    pricing: {
      note: 'This is a premium feature. Each analysis uses Claude API credits.',
      estimatedCost: {
        singleStock: '~$0.02-0.05',
        comparison: '~$0.03-0.06',
        top5Review: '~$0.05-0.10',
      },
    },
  });
}
