/**
 * Crown Jewel Comparison API
 *
 * POST /api/crown-jewels/compare
 * Body: { "stocks": ["CROX", "ANF"] }
 *
 * Vertaa kahta osaketta ja palauttaa analyysin
 */

import { NextResponse } from 'next/server';
import {
  STOCK_DATABASE,
  generateComparisonPrompt,
} from '@/lib/crown-jewel-prompt';
import {
  CURRENT_MACRO_ENVIRONMENT,
  calculateMacroAdjustedScore,
  compareStocksInMacroContext,
} from '@/lib/macro-analyzer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { stocks, includePrompt } = body;

    if (!stocks || !Array.isArray(stocks) || stocks.length !== 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide exactly 2 stock symbols in "stocks" array',
          example: { stocks: ['CROX', 'ANF'] },
        },
        { status: 400 }
      );
    }

    const [symbol1, symbol2] = stocks.map((s: string) => s.toUpperCase());

    const stock1 = STOCK_DATABASE[symbol1];
    const stock2 = STOCK_DATABASE[symbol2];

    if (!stock1) {
      return NextResponse.json(
        { success: false, error: `Stock ${symbol1} not found in database` },
        { status: 404 }
      );
    }

    if (!stock2) {
      return NextResponse.json(
        { success: false, error: `Stock ${symbol2} not found in database` },
        { status: 404 }
      );
    }

    // Laske makro-adjusted pisteet
    const macro1 = calculateMacroAdjustedScore(stock1.baseScore, stock1.sector, CURRENT_MACRO_ENVIRONMENT);
    const macro2 = calculateMacroAdjustedScore(stock2.baseScore, stock2.sector, CURRENT_MACRO_ENVIRONMENT);

    // Makrokonteksti vertailu
    const macroComparison = compareStocksInMacroContext(
      { symbol: symbol1, sector: stock1.sector, baseScore: stock1.baseScore },
      { symbol: symbol2, sector: stock2.sector, baseScore: stock2.baseScore },
      CURRENT_MACRO_ENVIRONMENT
    );

    // Määritä voittaja
    const winner = macro1.adjustedScore >= macro2.adjustedScore ? symbol1 : symbol2;
    const winnerStock = winner === symbol1 ? stock1 : stock2;
    const winnerMacro = winner === symbol1 ? macro1 : macro2;
    const loser = winner === symbol1 ? symbol2 : symbol1;
    const loserStock = winner === symbol1 ? stock2 : stock1;
    const loserMacro = winner === symbol1 ? macro2 : macro1;

    // Vertailutaulukko
    const comparisonTable = {
      metric: [
        'Tier',
        'Base Score',
        'Macro-Adjusted Score',
        'Macro Bonus',
        'QM Score',
        'Value Gap %',
        '5Y ROIC %',
        'Operating Margin %',
        '5Y Revenue Growth %',
        '5Y Income Growth %',
        'Share Change 5Y %',
        'Debt/FCF',
        'FCF Yield %',
        'Sector Outlook',
        'Risk Level',
      ],
      [symbol1]: [
        stock1.tier,
        stock1.baseScore,
        macro1.adjustedScore,
        macro1.macroBonus,
        stock1.qmScore,
        stock1.valueGapPercent,
        stock1.roic5yPercent,
        stock1.operatingMarginPercent,
        stock1.revenueGrowth5yPercent,
        stock1.incomeGrowth5yPercent,
        stock1.sharesChange5yPercent,
        stock1.debtToFcfRatio,
        stock1.fcfYieldPercent,
        macro1.sectorOutlook,
        macro1.riskLevel,
      ],
      [symbol2]: [
        stock2.tier,
        stock2.baseScore,
        macro2.adjustedScore,
        macro2.macroBonus,
        stock2.qmScore,
        stock2.valueGapPercent,
        stock2.roic5yPercent,
        stock2.operatingMarginPercent,
        stock2.revenueGrowth5yPercent,
        stock2.incomeGrowth5yPercent,
        stock2.sharesChange5yPercent,
        stock2.debtToFcfRatio,
        stock2.fcfYieldPercent,
        macro2.sectorOutlook,
        macro2.riskLevel,
      ],
      winner: [] as string[],
    };

    // Määritä voittaja per metriikka
    const metrics = comparisonTable.metric;
    const s1Values = comparisonTable[symbol1];
    const s2Values = comparisonTable[symbol2];

    for (let i = 0; i < metrics.length; i++) {
      const metric = metrics[i];
      const v1 = s1Values[i];
      const v2 = s2Values[i];

      // Määritä kumpi on parempi per metriikka
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        if (metric.includes('Debt') || metric.includes('Share Change')) {
          // Pienempi on parempi
          comparisonTable.winner.push(v1 < v2 ? symbol1 : v2 < v1 ? symbol2 : 'Tie');
        } else {
          // Suurempi on parempi
          comparisonTable.winner.push(v1 > v2 ? symbol1 : v2 > v1 ? symbol2 : 'Tie');
        }
      } else if (metric === 'Tier') {
        const tierRank: Record<string, number> = { 'crown-jewel': 4, diamond: 3, gold: 2, silver: 1 };
        comparisonTable.winner.push(
          (tierRank[v1 as string] || 0) > (tierRank[v2 as string] || 0) ? symbol1 :
          (tierRank[v2 as string] || 0) > (tierRank[v1 as string] || 0) ? symbol2 : 'Tie'
        );
      } else if (metric === 'Sector Outlook') {
        const outlookRank: Record<string, number> = { bullish: 3, neutral: 2, bearish: 1 };
        comparisonTable.winner.push(
          (outlookRank[v1 as string] || 0) > (outlookRank[v2 as string] || 0) ? symbol1 :
          (outlookRank[v2 as string] || 0) > (outlookRank[v1 as string] || 0) ? symbol2 : 'Tie'
        );
      } else if (metric === 'Risk Level') {
        const riskRank: Record<string, number> = { low: 3, medium: 2, high: 1 };
        comparisonTable.winner.push(
          (riskRank[v1 as string] || 0) > (riskRank[v2 as string] || 0) ? symbol1 :
          (riskRank[v2 as string] || 0) > (riskRank[v1 as string] || 0) ? symbol2 : 'Tie'
        );
      } else {
        comparisonTable.winner.push('N/A');
      }
    }

    // Laske voitot
    const wins1 = comparisonTable.winner.filter(w => w === symbol1).length;
    const wins2 = comparisonTable.winner.filter(w => w === symbol2).length;

    // Geneerinen analyysi
    const analysis = generateComparisonAnalysis(
      { stock: stock1, macro: macro1, symbol: symbol1 },
      { stock: stock2, macro: macro2, symbol: symbol2 },
      winner,
      wins1,
      wins2
    );

    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),

      // Voittaja
      verdict: {
        winner,
        winnerTier: winnerStock.tier,
        winnerScore: winnerMacro.adjustedScore,
        loser,
        loserTier: loserStock.tier,
        loserScore: loserMacro.adjustedScore,
        scoreDifference: winnerMacro.adjustedScore - loserMacro.adjustedScore,
        metricsWon: { [symbol1]: wins1, [symbol2]: wins2 },
      },

      // Vertailutaulukko
      comparison: comparisonTable,

      // Analyysi
      analysis,

      // Makrokonteksti
      macroContext: {
        phase: CURRENT_MACRO_ENVIRONMENT.phase,
        analysis: macroComparison.analysis,
      },
    };

    // Claude-prompt jos pyydetty
    if (includePrompt) {
      response.claudePrompt = generateComparisonPrompt(symbol1, symbol2);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Crown Jewel compare API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateComparisonAnalysis(
  s1: { stock: any; macro: any; symbol: string },
  s2: { stock: any; macro: any; symbol: string },
  winner: string,
  wins1: number,
  wins2: number
): {
  summary: string;
  qualityComparison: string;
  valuationComparison: string;
  macroComparison: string;
  recommendation: string;
} {
  const winnerData = winner === s1.symbol ? s1 : s2;
  const loserData = winner === s1.symbol ? s2 : s1;

  // Yhteenveto
  const summary = `${winner} voittaa vertailun pisteillä ${winnerData.macro.adjustedScore} vs ${loserData.macro.adjustedScore}. ` +
    `Metriikkavertailussa ${winner} voittaa ${winner === s1.symbol ? wins1 : wins2}/${wins1 + wins2} kategoriassa.`;

  // Laatuvertailu
  let qualityComparison = '';
  if (s1.stock.roic5yPercent > s2.stock.roic5yPercent * 1.2) {
    qualityComparison = `${s1.symbol} on selvästi laadukkaampi (ROIC ${s1.stock.roic5yPercent}% vs ${s2.stock.roic5yPercent}%). `;
  } else if (s2.stock.roic5yPercent > s1.stock.roic5yPercent * 1.2) {
    qualityComparison = `${s2.symbol} on selvästi laadukkaampi (ROIC ${s2.stock.roic5yPercent}% vs ${s1.stock.roic5yPercent}%). `;
  } else {
    qualityComparison = `Molemmat ovat korkealaatuisia yhtiöitä (ROIC ${s1.stock.roic5yPercent}% vs ${s2.stock.roic5yPercent}%). `;
  }

  if (s1.stock.qmScore > s2.stock.qmScore) {
    qualityComparison += `${s1.symbol} saa korkeammat QM-pisteet (${s1.stock.qmScore}/8 vs ${s2.stock.qmScore}/8).`;
  } else if (s2.stock.qmScore > s1.stock.qmScore) {
    qualityComparison += `${s2.symbol} saa korkeammat QM-pisteet (${s2.stock.qmScore}/8 vs ${s1.stock.qmScore}/8).`;
  } else {
    qualityComparison += `Molemmilla sama QM-pisteet (${s1.stock.qmScore}/8).`;
  }

  // Arvostusvertailu
  let valuationComparison = '';
  const vgDiff = Math.abs(s1.stock.valueGapPercent - s2.stock.valueGapPercent);
  if (vgDiff > 20) {
    const cheaper = s1.stock.valueGapPercent > s2.stock.valueGapPercent ? s1.symbol : s2.symbol;
    const cheaperVG = s1.stock.valueGapPercent > s2.stock.valueGapPercent ? s1.stock.valueGapPercent : s2.stock.valueGapPercent;
    valuationComparison = `${cheaper} on selvästi halvempi (Value Gap ${cheaperVG}% vs ${Math.min(s1.stock.valueGapPercent, s2.stock.valueGapPercent)}%).`;
  } else {
    valuationComparison = `Molemmat samankaltaisesti arvostettu (Value Gap ${s1.stock.valueGapPercent}% vs ${s2.stock.valueGapPercent}%).`;
  }

  // Makrovertailu
  let macroComparison = '';
  if (s1.macro.macroBonus !== s2.macro.macroBonus) {
    const betterMacro = s1.macro.macroBonus > s2.macro.macroBonus ? s1 : s2;
    const worseMacro = s1.macro.macroBonus > s2.macro.macroBonus ? s2 : s1;
    macroComparison = `${betterMacro.symbol} (${betterMacro.stock.sector}) sopii paremmin nykyiseen talousympäristöön ` +
      `(makrobonus ${betterMacro.macro.macroBonus > 0 ? '+' : ''}${betterMacro.macro.macroBonus} vs ${worseMacro.macro.macroBonus > 0 ? '+' : ''}${worseMacro.macro.macroBonus}).`;
  } else {
    macroComparison = `Molemmat sektorit sopivat samalla tavalla nykyiseen ympäristöön (makrobonus ${s1.macro.macroBonus}).`;
  }

  // Suositus
  let recommendation = `**Suositus: ${winner}** - `;
  if (winnerData.stock.tier === 'crown-jewel') {
    recommendation += `Crown Jewel -status tekee ${winner}:sta ensisijaisen valinnan. `;
  }

  const scoreDiff = winnerData.macro.adjustedScore - loserData.macro.adjustedScore;
  if (scoreDiff <= 2) {
    recommendation += `Ero on kuitenkin pieni (${scoreDiff} pistettä), joten molemmat ovat hyviä valintoja. `;
    recommendation += `Hajauta molempiin jos mahdollista.`;
  } else if (scoreDiff <= 5) {
    recommendation += `${winner} on selvästi parempi valinta tällä hetkellä. `;
    recommendation += `${loserData.symbol} on hyvä vaihtoehto jos haluat hajauttaa sektorillisesti.`;
  } else {
    recommendation += `${winner} on ylivoimaisesti parempi valinta nykytilanteessa.`;
  }

  return {
    summary,
    qualityComparison,
    valuationComparison,
    macroComparison,
    recommendation,
  };
}
