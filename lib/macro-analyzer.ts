/**
 * Macro-Economic Cycle Analyzer
 *
 * Analysoi talousympäristön ja arvioi sektorien tulevaisuuden potentiaalin.
 * Käytetään Crown Jewels -osakkeiden tarkempaan erotteluun.
 *
 * Taloussyklit:
 * 1. Early Recovery (Elpyminen) - Korkojen lasku, likviditeetin kasvu
 * 2. Mid Expansion (Kasvu) - Matala työttömyys, vahva kulutus
 * 3. Late Expansion (Myöhäinen kasvu) - Inflaatio nousee, korot nousevat
 * 4. Recession (Taantuma) - Kulutus laskee, työttömyys nousee
 */

/**
 * Talousympäristön vaiheet
 */
export type EconomicPhase =
  | 'early-recovery'   // Elpyminen taantumasta
  | 'mid-expansion'    // Keskivaihe, vahva kasvu
  | 'late-expansion'   // Myöhäinen kasvu, ylikuumeneminen
  | 'recession';       // Taantuma

/**
 * Likviditeettitilanne
 */
export type LiquidityEnvironment =
  | 'expanding'        // Fed printaa, QE, korot laskussa
  | 'stable'           // Tasapaino
  | 'tightening';      // QT, korot nousussa

/**
 * Markkinasentimentti
 */
export type MarketSentiment =
  | 'risk-on'          // Riskihalua, kasvuosakkeet
  | 'neutral'          // Tasainen
  | 'risk-off';        // Turvasatama, defensiiviset

/**
 * Makroympäristön snapshot
 */
export interface MacroEnvironment {
  phase: EconomicPhase;
  liquidity: LiquidityEnvironment;
  sentiment: MarketSentiment;

  // Indikaattorit
  fedFundsRate: number;           // Fed ohjauskorko %
  inflation: number;              // CPI YoY %
  unemployment: number;           // Työttömyysaste %
  yieldCurveSpread: number;       // 10Y-2Y spread (bps)
  vix: number;                    // Volatiliteetti-indeksi
  m2Growth: number;               // M2 rahan kasvu YoY %
  creditSpread: number;           // HY spread (bps)

  // Päivitystiedot
  lastUpdated: string;
  source: string;
}

/**
 * Sektorin syklinen käyttäytyminen
 */
export interface SectorCycleProfile {
  sector: string;

  // Missä vaiheessa sektori menestyy parhaiten (1-10)
  earlyRecoveryScore: number;
  midExpansionScore: number;
  lateExpansionScore: number;
  recessionScore: number;

  // Likviditeettisensitiivisyys (-10 to +10)
  // Positiivinen = hyötyy likviditeetistä
  liquiditySensitivity: number;

  // Korkosensitiivisyys (-10 to +10)
  // Negatiivinen = kärsii korkeista koroista
  rateSensitivity: number;

  // Defensiivisyys (0-10)
  // Korkea = kestää taantumaa hyvin
  defensiveness: number;

  // Kasvupotentiaali (0-10)
  growthPotential: number;
}

/**
 * Sektorien sykliprofiilit - perustuu historialliseen dataan
 */
export const SECTOR_CYCLE_PROFILES: Record<string, SectorCycleProfile> = {
  'Technology': {
    sector: 'Technology',
    earlyRecoveryScore: 9,    // Ensimmäisenä elpyy
    midExpansionScore: 10,    // Paras vaihe
    lateExpansionScore: 6,    // Alkaa heikentyä
    recessionScore: 4,        // Kärsii
    liquiditySensitivity: 8,  // Hyötyy paljon likviditeetistä
    rateSensitivity: -7,      // Kärsii korkeista koroista (DCF)
    defensiveness: 3,
    growthPotential: 10,
  },
  'Consumer Cyclical': {
    sector: 'Consumer Cyclical',
    earlyRecoveryScore: 10,   // Paras sektori elpymisessä
    midExpansionScore: 8,
    lateExpansionScore: 5,
    recessionScore: 3,        // Kärsii eniten
    liquiditySensitivity: 6,
    rateSensitivity: -4,
    defensiveness: 2,
    growthPotential: 8,
  },
  'Financials': {
    sector: 'Financials',
    earlyRecoveryScore: 8,
    midExpansionScore: 7,
    lateExpansionScore: 9,    // Hyötyy korkeista koroista
    recessionScore: 4,
    liquiditySensitivity: 5,
    rateSensitivity: 6,       // Hyötyy korkeista koroista
    defensiveness: 4,
    growthPotential: 6,
  },
  'Financial Services': {
    sector: 'Financial Services',
    earlyRecoveryScore: 8,
    midExpansionScore: 7,
    lateExpansionScore: 8,
    recessionScore: 5,
    liquiditySensitivity: 6,
    rateSensitivity: 4,
    defensiveness: 5,
    growthPotential: 7,
  },
  'Industrials': {
    sector: 'Industrials',
    earlyRecoveryScore: 9,
    midExpansionScore: 8,
    lateExpansionScore: 6,
    recessionScore: 4,
    liquiditySensitivity: 4,
    rateSensitivity: -3,
    defensiveness: 4,
    growthPotential: 7,
  },
  'Healthcare': {
    sector: 'Healthcare',
    earlyRecoveryScore: 5,
    midExpansionScore: 6,
    lateExpansionScore: 7,
    recessionScore: 9,        // Defensiivinen
    liquiditySensitivity: 2,
    rateSensitivity: -2,
    defensiveness: 9,
    growthPotential: 6,
  },
  'Consumer Defensive': {
    sector: 'Consumer Defensive',
    earlyRecoveryScore: 4,
    midExpansionScore: 5,
    lateExpansionScore: 6,
    recessionScore: 10,       // Paras taantumassa
    liquiditySensitivity: 1,
    rateSensitivity: -1,
    defensiveness: 10,
    growthPotential: 4,
  },
  'Utilities': {
    sector: 'Utilities',
    earlyRecoveryScore: 3,
    midExpansionScore: 4,
    lateExpansionScore: 5,
    recessionScore: 9,
    liquiditySensitivity: 2,
    rateSensitivity: -5,      // Kärsii koroista (velkainen)
    defensiveness: 9,
    growthPotential: 3,
  },
  'Energy': {
    sector: 'Energy',
    earlyRecoveryScore: 6,
    midExpansionScore: 7,
    lateExpansionScore: 10,   // Hyötyy inflaatiosta
    recessionScore: 5,
    liquiditySensitivity: 3,
    rateSensitivity: 2,
    defensiveness: 5,
    growthPotential: 6,
  },
  'Basic Materials': {
    sector: 'Basic Materials',
    earlyRecoveryScore: 7,
    midExpansionScore: 8,
    lateExpansionScore: 9,    // Hyötyy inflaatiosta
    recessionScore: 4,
    liquiditySensitivity: 4,
    rateSensitivity: 0,
    defensiveness: 4,
    growthPotential: 6,
  },
  'Real Estate': {
    sector: 'Real Estate',
    earlyRecoveryScore: 8,
    midExpansionScore: 7,
    lateExpansionScore: 4,
    recessionScore: 5,
    liquiditySensitivity: 7,
    rateSensitivity: -8,      // Erittäin korkosensitiivinen
    defensiveness: 5,
    growthPotential: 5,
  },
  'Communication Services': {
    sector: 'Communication Services',
    earlyRecoveryScore: 7,
    midExpansionScore: 8,
    lateExpansionScore: 6,
    recessionScore: 6,
    liquiditySensitivity: 5,
    rateSensitivity: -4,
    defensiveness: 6,
    growthPotential: 7,
  },
};

/**
 * Laske sektorin odotettu suorituskyky nykyisessä makroympäristössä
 */
export function calculateSectorMacroScore(
  sector: string,
  environment: MacroEnvironment
): {
  score: number;           // 0-100
  phaseAlignment: number;  // Kuinka hyvin sektori sopii tähän vaiheeseen
  liquidityImpact: number; // Likviditeetin vaikutus
  rateImpact: number;      // Korkojen vaikutus
  outlook: 'bullish' | 'neutral' | 'bearish';
  reasoning: string;
} {
  const profile = SECTOR_CYCLE_PROFILES[sector];
  if (!profile) {
    return {
      score: 50,
      phaseAlignment: 5,
      liquidityImpact: 0,
      rateImpact: 0,
      outlook: 'neutral',
      reasoning: 'Unknown sector',
    };
  }

  // 1. Phase alignment (0-40 pistettä)
  let phaseScore = 0;
  switch (environment.phase) {
    case 'early-recovery':
      phaseScore = profile.earlyRecoveryScore;
      break;
    case 'mid-expansion':
      phaseScore = profile.midExpansionScore;
      break;
    case 'late-expansion':
      phaseScore = profile.lateExpansionScore;
      break;
    case 'recession':
      phaseScore = profile.recessionScore;
      break;
  }
  const phaseAlignment = phaseScore * 4; // Max 40

  // 2. Liquidity impact (0-30 pistettä)
  let liquidityMultiplier = 0;
  switch (environment.liquidity) {
    case 'expanding':
      liquidityMultiplier = 1;
      break;
    case 'stable':
      liquidityMultiplier = 0;
      break;
    case 'tightening':
      liquidityMultiplier = -1;
      break;
  }
  const liquidityImpact = 15 + (profile.liquiditySensitivity * liquidityMultiplier * 1.5);

  // 3. Rate impact (0-30 pistettä)
  // Normalisoi korko 0-10% välille
  const rateNormalized = Math.min(10, Math.max(0, environment.fedFundsRate)) / 10;
  // Jos sektori hyötyy koroista (positiivinen rateSensitivity), korkea korko on hyvä
  const rateImpact = 15 + (profile.rateSensitivity * (rateNormalized - 0.5) * 3);

  // Yhteispisteet
  const totalScore = Math.min(100, Math.max(0, phaseAlignment + liquidityImpact + rateImpact));

  // Outlook
  let outlook: 'bullish' | 'neutral' | 'bearish' = 'neutral';
  if (totalScore >= 70) outlook = 'bullish';
  else if (totalScore <= 40) outlook = 'bearish';

  // Reasoning
  const phaseNames = {
    'early-recovery': 'elpyminen',
    'mid-expansion': 'kasvuvaihe',
    'late-expansion': 'myöhäinen kasvu',
    'recession': 'taantuma',
  };

  let reasoning = `${sector} `;
  if (phaseScore >= 8) {
    reasoning += `on historiallisesti erinomainen sektori ${phaseNames[environment.phase]}ssa. `;
  } else if (phaseScore <= 4) {
    reasoning += `tyypillisesti alisuoriutuu ${phaseNames[environment.phase]}ssa. `;
  } else {
    reasoning += `suoriutuu keskimääräisesti ${phaseNames[environment.phase]}ssa. `;
  }

  if (environment.liquidity === 'expanding' && profile.liquiditySensitivity > 5) {
    reasoning += 'Hyötyy merkittävästi löysästä rahapolitiikasta. ';
  } else if (environment.liquidity === 'tightening' && profile.liquiditySensitivity > 5) {
    reasoning += 'Kärsii kiristyvästä rahapolitiikasta. ';
  }

  if (environment.fedFundsRate > 4 && profile.rateSensitivity < -5) {
    reasoning += 'Korkea korkotaso painaa arvostuksia. ';
  } else if (environment.fedFundsRate > 4 && profile.rateSensitivity > 5) {
    reasoning += 'Hyötyy korkeasta korkotasosta. ';
  }

  return {
    score: Math.round(totalScore),
    phaseAlignment: Math.round(phaseAlignment),
    liquidityImpact: Math.round(liquidityImpact),
    rateImpact: Math.round(rateImpact),
    outlook,
    reasoning: reasoning.trim(),
  };
}

/**
 * Nykyinen makroympäristö (päivitettävä manuaalisesti tai API:lla)
 * TÄMÄ ON MUUTTUJA JOTA PÄIVITETÄÄN
 */
export const CURRENT_MACRO_ENVIRONMENT: MacroEnvironment = {
  // Joulukuu 2024 tilanne
  phase: 'late-expansion',       // Talous vahva mutta hidastumassa
  liquidity: 'tightening',       // QT jatkuu, korot korkealla
  sentiment: 'risk-on',          // Markkinat silti optimistiset

  fedFundsRate: 4.5,             // Fed funds rate %
  inflation: 2.7,                // CPI YoY %
  unemployment: 4.2,             // Työttömyysaste %
  yieldCurveSpread: 20,          // 10Y-2Y spread (bps)
  vix: 14,                       // VIX
  m2Growth: -2.5,                // M2 kasvu YoY %
  creditSpread: 300,             // HY spread (bps)

  lastUpdated: '2024-12-27',
  source: 'Manual input',
};

/**
 * Laske makro-adjusted Crown Jewel score
 * Tämä erottelee 99/100 pisteet tarkemmin
 */
export function calculateMacroAdjustedScore(
  baseScore: number,
  sector: string,
  environment: MacroEnvironment = CURRENT_MACRO_ENVIRONMENT
): {
  adjustedScore: number;
  macroBonus: number;
  sectorOutlook: 'bullish' | 'neutral' | 'bearish';
  cycleFit: string;
  riskLevel: 'low' | 'medium' | 'high';
} {
  const sectorMacro = calculateSectorMacroScore(sector, environment);

  // Makro-bonus/rangaistus (-10 to +10 pistettä)
  // Perustuu sektorin sopivuuteen nykyiseen ympäristöön
  const macroBonus = Math.round((sectorMacro.score - 50) / 5);

  const adjustedScore = Math.min(110, Math.max(0, baseScore + macroBonus));

  // Risk level based on cycle fit and liquidity
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  const profile = SECTOR_CYCLE_PROFILES[sector];

  if (profile) {
    if (environment.phase === 'recession' && profile.defensiveness >= 8) {
      riskLevel = 'low';
    } else if (environment.phase === 'recession' && profile.defensiveness <= 4) {
      riskLevel = 'high';
    } else if (environment.liquidity === 'tightening' && profile.liquiditySensitivity >= 7) {
      riskLevel = 'high';
    } else if (sectorMacro.score >= 70) {
      riskLevel = 'low';
    }
  }

  // Cycle fit description
  let cycleFit = '';
  if (sectorMacro.score >= 75) {
    cycleFit = 'Erinomainen sopivuus nykyiseen taloussykliin';
  } else if (sectorMacro.score >= 60) {
    cycleFit = 'Hyvä sopivuus nykyiseen taloussykliin';
  } else if (sectorMacro.score >= 45) {
    cycleFit = 'Keskinkertainen sopivuus nykyiseen taloussykliin';
  } else {
    cycleFit = 'Heikko sopivuus nykyiseen taloussykliin';
  }

  return {
    adjustedScore,
    macroBonus,
    sectorOutlook: sectorMacro.outlook,
    cycleFit,
    riskLevel,
  };
}

/**
 * Vertaa kahta Crown Jewel -osaketta makroympäristön valossa
 */
export function compareStocksInMacroContext(
  stock1: { symbol: string; sector: string; baseScore: number },
  stock2: { symbol: string; sector: string; baseScore: number },
  environment: MacroEnvironment = CURRENT_MACRO_ENVIRONMENT
): {
  winner: string;
  analysis: string;
  stock1Analysis: ReturnType<typeof calculateMacroAdjustedScore>;
  stock2Analysis: ReturnType<typeof calculateMacroAdjustedScore>;
} {
  const s1 = calculateMacroAdjustedScore(stock1.baseScore, stock1.sector, environment);
  const s2 = calculateMacroAdjustedScore(stock2.baseScore, stock2.sector, environment);

  const winner = s1.adjustedScore >= s2.adjustedScore ? stock1.symbol : stock2.symbol;
  const loser = winner === stock1.symbol ? stock2.symbol : stock1.symbol;
  const winnerAnalysis = winner === stock1.symbol ? s1 : s2;
  const loserAnalysis = winner === stock1.symbol ? s2 : s1;

  let analysis = `Nykyisessä talousympäristössä (${environment.phase}) `;
  analysis += `${winner} on parempi valinta kuin ${loser}. `;

  if (winnerAnalysis.macroBonus > loserAnalysis.macroBonus) {
    analysis += `${winner} saa ${winnerAnalysis.macroBonus - loserAnalysis.macroBonus} pisteen makroedun `;
    analysis += `johtuen paremmasta sopivuudesta nykyiseen taloussykliin. `;
  }

  if (winnerAnalysis.riskLevel === 'low' && loserAnalysis.riskLevel === 'high') {
    analysis += `${winner} on myös matalamman riskin valinta tässä ympäristössä.`;
  }

  return {
    winner,
    analysis,
    stock1Analysis: s1,
    stock2Analysis: s2,
  };
}
