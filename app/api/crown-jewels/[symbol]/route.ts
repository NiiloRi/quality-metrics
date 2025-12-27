/**
 * Crown Jewel Single Stock API
 *
 * GET /api/crown-jewels/CROX - Hae yksittäisen osakkeen tiedot
 * GET /api/crown-jewels/CROX?analysis=true - Sisällytä Claude-prompt
 */

import { NextResponse } from 'next/server';
import {
  STOCK_DATABASE,
  generateSingleStockAnalysisPrompt,
  MACRO_SNAPSHOT,
} from '@/lib/crown-jewel-prompt';
import {
  CURRENT_MACRO_ENVIRONMENT,
  calculateSectorMacroScore,
  calculateMacroAdjustedScore,
} from '@/lib/macro-analyzer';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const { searchParams } = new URL(request.url);
    const includeAnalysis = searchParams.get('analysis') === 'true';
    const includePrompt = searchParams.get('prompt') === 'true';

    const upperSymbol = symbol.toUpperCase();
    const stock = STOCK_DATABASE[upperSymbol];

    if (!stock) {
      return NextResponse.json(
        {
          success: false,
          error: `Stock ${upperSymbol} not found in Crown Jewel database`,
          availableStocks: Object.keys(STOCK_DATABASE),
        },
        { status: 404 }
      );
    }

    // Laske makro-adjusted pisteet
    const macroAdjusted = calculateMacroAdjustedScore(
      stock.baseScore,
      stock.sector,
      CURRENT_MACRO_ENVIRONMENT
    );

    // Laske sektorin makro-score
    const sectorMacro = calculateSectorMacroScore(stock.sector, CURRENT_MACRO_ENVIRONMENT);

    // Perusresponse
    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),

      stock: {
        // Perustiedot
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector,
        industry: stock.industry,
        marketCapB: stock.marketCapB,

        // Crown Jewel status
        tier: stock.tier,
        tierIcon: stock.tier === 'crown-jewel' ? '👑' : stock.tier === 'diamond' ? '💎' : stock.tier === 'gold' ? '🥇' : '🥈',
        tierDescription: getTierDescription(stock.tier),

        // Pisteet
        scores: {
          base: stock.baseScore,
          adjusted: macroAdjusted.adjustedScore,
          macroBonus: macroAdjusted.macroBonus,
          qm: stock.qmScore,
        },

        // QM Pillarit
        qmPillars: stock.qmPillars,

        // Arvostus
        valuation: {
          currentPE: stock.currentPE,
          fairPE: stock.fairPE,
          valueGapPercent: stock.valueGapPercent,
          isUndervalued: stock.valueGapPercent > 0,
          valuationStatus: getValuationStatus(stock.valueGapPercent),
        },

        // Laatu
        quality: {
          roic5yPercent: stock.roic5yPercent,
          operatingMarginPercent: stock.operatingMarginPercent,
          grossMarginPercent: stock.grossMarginPercent,
          roePercent: stock.roePercent,
        },

        // Kasvu
        growth: {
          revenueGrowth5yPercent: stock.revenueGrowth5yPercent,
          incomeGrowth5yPercent: stock.incomeGrowth5yPercent,
          fcfGrowth5yPercent: stock.fcfGrowth5yPercent,
        },

        // Pääoman allokaatio
        capitalAllocation: {
          sharesChange5yPercent: stock.sharesChange5yPercent,
          hasBuybacks: stock.sharesChange5yPercent < 0,
          debtToFcfRatio: stock.debtToFcfRatio,
          fcfYieldPercent: stock.fcfYieldPercent,
        },

        lastUpdated: stock.lastUpdated,
      },

      // Makroanalyysi
      macroAnalysis: {
        environment: {
          phase: CURRENT_MACRO_ENVIRONMENT.phase,
          phaseDescription: getPhaseDescription(CURRENT_MACRO_ENVIRONMENT.phase),
          liquidity: CURRENT_MACRO_ENVIRONMENT.liquidity,
          sentiment: CURRENT_MACRO_ENVIRONMENT.sentiment,
        },
        sectorFit: {
          score: sectorMacro.score,
          outlook: sectorMacro.outlook,
          reasoning: sectorMacro.reasoning,
        },
        stockImpact: {
          cycleFit: macroAdjusted.cycleFit,
          riskLevel: macroAdjusted.riskLevel,
          sectorOutlook: macroAdjusted.sectorOutlook,
        },
      },
    };

    // Sisällytä analyysi jos pyydetty
    if (includeAnalysis) {
      response.analysis = generateQuickAnalysis(stock, macroAdjusted, sectorMacro);
    }

    // Sisällytä Claude-prompt jos pyydetty
    if (includePrompt) {
      response.claudePrompt = generateSingleStockAnalysisPrompt(upperSymbol);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Crown Jewel stock API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTierDescription(tier: string): string {
  switch (tier) {
    case 'crown-jewel':
      return 'Eliittiluokan sijoituskohde - täydellinen laatu, syvä aliarvostus, kaikki kasvusignaalit';
    case 'diamond':
      return 'Premium-laatuyhtiö - erinomainen laatu ja arvostus';
    case 'gold':
      return 'Korkealaatuinen - hyvä laatu ja kohtuullinen aliarvostus';
    case 'silver':
      return 'Lupaava - hyvä potentiaali, seuraa kehitystä';
    default:
      return 'Unknown';
  }
}

function getValuationStatus(valueGap: number): string {
  if (valueGap >= 50) return 'Erittäin aliarvostettu';
  if (valueGap >= 30) return 'Syvästi aliarvostettu';
  if (valueGap >= 15) return 'Aliarvostettu';
  if (valueGap >= 0) return 'Oikein hinnoiteltu';
  if (valueGap >= -15) return 'Lievästi yliarvostettu';
  return 'Yliarvostettu';
}

function getPhaseDescription(phase: string): string {
  switch (phase) {
    case 'early-recovery':
      return 'Elpyminen taantumasta - kasvuodotukset nousevat';
    case 'mid-expansion':
      return 'Keskivaihe - vahva kasvu, matala työttömyys';
    case 'late-expansion':
      return 'Myöhäinen kasvu - inflaatiopaineet, talous ylikuumenee';
    case 'recession':
      return 'Taantuma - kulutus laskee, defensiiviset sektorit';
    default:
      return 'Unknown';
  }
}

function generateQuickAnalysis(
  stock: any,
  macroAdjusted: any,
  sectorMacro: any
): {
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: string;
} {
  const strengths: string[] = [];
  const risks: string[] = [];

  // Vahvuudet
  if (stock.qmScore === 8) {
    strengths.push('Täydellinen QM-pisteet 8/8 - kaikki laatukriteerit täyttyvät');
  } else if (stock.qmScore >= 7) {
    strengths.push(`Erinomainen QM-pisteet ${stock.qmScore}/8`);
  }

  if (stock.valueGapPercent >= 50) {
    strengths.push(`Erittäin aliarvostettu (${stock.valueGapPercent}% alle fair value)`);
  } else if (stock.valueGapPercent >= 30) {
    strengths.push(`Syvästi aliarvostettu (${stock.valueGapPercent}% alle fair value)`);
  }

  if (stock.roic5yPercent >= 50) {
    strengths.push(`Erinomainen pääoman tuotto (5v ROIC ${stock.roic5yPercent}%)`);
  }

  if (stock.sharesChange5yPercent < -10) {
    strengths.push(`Vahvat takaisinostot (${Math.abs(stock.sharesChange5yPercent)}% osakkeiden väheneminen)`);
  }

  if (stock.fcfYieldPercent >= 10) {
    strengths.push(`Korkea FCF-tuotto (${stock.fcfYieldPercent}%)`);
  }

  // Riskit
  if (sectorMacro.outlook === 'bearish') {
    risks.push(`Sektori (${stock.sector}) heikossa asemassa nykyisessä talousympäristössä`);
  }

  if (macroAdjusted.riskLevel === 'high') {
    risks.push('Kohonnut riski nykyisessä makroympäristössä');
  }

  if (stock.debtToFcfRatio > 3) {
    risks.push(`Kohonnut velkaisuus (Debt/FCF ${stock.debtToFcfRatio}x)`);
  }

  if (stock.sector === 'Consumer Cyclical') {
    risks.push('Syklinen sektori - herkkä talouden heilahteluille');
  }

  // Suositus
  let recommendation = '';
  if (stock.tier === 'crown-jewel') {
    recommendation = `👑 VAHVA OSTO - ${stock.symbol} on Crown Jewel -statuksella harvoja eliittiluokan sijoituskohteita. `;
    recommendation += `Yhdistelmä täydellistä laatua (${stock.qmScore}/8) ja syvää aliarvostusta (${stock.valueGapPercent}%) on poikkeuksellinen. `;
  } else if (stock.tier === 'diamond') {
    recommendation = `💎 OSTA - ${stock.symbol} on Diamond-tier yhtiö eli premium-laatua kohtuulliseen hintaan. `;
  } else if (stock.tier === 'gold') {
    recommendation = `🥇 KERÄÄ - ${stock.symbol} tarjoaa hyvän laatu/hinta-suhteen. `;
  } else {
    recommendation = `🥈 SEURAA - ${stock.symbol} on mielenkiintoinen mutta vaatii lisäseurantaa. `;
  }

  if (macroAdjusted.macroBonus < 0) {
    recommendation += `Huomio: Sektori saa ${macroAdjusted.macroBonus} pisteen makrorangaistuksen nykyisessä ympäristössä.`;
  }

  const summary = `${stock.name} on ${stock.tier === 'crown-jewel' ? 'Crown Jewel' : stock.tier.charAt(0).toUpperCase() + stock.tier.slice(1)} -luokan sijoituskohde ` +
    `${stock.sector}-sektorilta. Osake on ${stock.valueGapPercent}% aliarvostettu suhteessa laadun perusteella laskettuun fair valueen. ` +
    `Makro-adjusted pisteet: ${macroAdjusted.adjustedScore}/100.`;

  return {
    summary,
    strengths,
    risks,
    recommendation,
  };
}
