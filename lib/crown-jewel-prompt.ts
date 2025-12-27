/**
 * Crown Jewel Deep Analysis - Claude API Prompt Templates
 *
 * Syväkoodatut promptit asiakasanalyysiin.
 * Nämä promptit tuottavat taattuja, johdonmukaisia tuloksia.
 *
 * Käyttö:
 * 1. Päivitä STOCK_DATABASE muuttuja skannauksen jälkeen
 * 2. Päivitä MACRO_SNAPSHOT nykyisellä makrodatalla
 * 3. Kutsu generateAnalysisPrompt() funktioilla
 */

import type { MacroEnvironment } from './macro-analyzer';
import { CURRENT_MACRO_ENVIRONMENT, SECTOR_CYCLE_PROFILES, calculateMacroAdjustedScore } from './macro-analyzer';

// ============================================================================
// SYVÄKOODATTU OSAKEDATA - PÄIVITÄ TÄMÄ SKANNAUKSEN JÄLKEEN
// ============================================================================

export interface CrownJewelStock {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCapB: number;          // Miljardeja $

  // QM-pisteet
  qmScore: number;             // 0-8
  qmPillars: {
    pe5y: boolean;             // 5v P/E < 22.5
    roic5y: boolean;           // 5v ROIC > 9%
    sharesDecreasing: boolean; // Osakkeet laskussa
    fcfGrowing: boolean;       // FCF kasvaa
    incomeGrowing: boolean;    // Tulos kasvaa
    revenueGrowing: boolean;   // Liikevaihto kasvaa
    debtLow: boolean;          // Velka/FCF < 5
    pfcf5y: boolean;           // 5v P/FCF < 22.5
  };

  // Arvostus
  valueGapPercent: number;     // Aliarvostus % (positiivinen = halpa)
  currentPE: number;
  fairPE: number;

  // Laatu
  roic5yPercent: number;
  operatingMarginPercent: number;
  grossMarginPercent: number;
  roePercent: number | null;

  // Kasvu
  revenueGrowth5yPercent: number;
  incomeGrowth5yPercent: number;
  fcfGrowth5yPercent: number;

  // Pääoman allokaatio
  sharesChange5yPercent: number;
  debtToFcfRatio: number;
  fcfYieldPercent: number;

  // Hidden Gem taso
  tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver';
  baseScore: number;           // 0-100 ennen makroadjustia

  // Päivitys
  lastUpdated: string;
}

/**
 * OSAKEDATA - Päivitä tämä skannauksen jälkeen
 * Tämä on "syväkoodattu" data jota käytetään ilman API-kutsuja
 */
export const STOCK_DATABASE: Record<string, CrownJewelStock> = {
  // =========================================================================
  // CROWN JEWELS (Score 95+)
  // =========================================================================
  'CROX': {
    symbol: 'CROX',
    name: 'Crocs, Inc.',
    sector: 'Consumer Cyclical',
    industry: 'Footwear & Accessories',
    marketCapB: 5.1,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 78,
    currentPE: 5.5,
    fairPE: 25,
    roic5yPercent: 84,
    operatingMarginPercent: 26,
    grossMarginPercent: 58,
    roePercent: 65,
    revenueGrowth5yPercent: 180,
    incomeGrowth5yPercent: 420,
    fcfGrowth5yPercent: 350,
    sharesChange5yPercent: -15,
    debtToFcfRatio: 1.8,
    fcfYieldPercent: 14,
    tier: 'crown-jewel',
    baseScore: 100,
    lastUpdated: '2024-12-27',
  },
  'ANF': {
    symbol: 'ANF',
    name: 'Abercrombie & Fitch Co.',
    sector: 'Consumer Cyclical',
    industry: 'Apparel Retail',
    marketCapB: 6.0,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 58,
    currentPE: 10.5,
    fairPE: 25,
    roic5yPercent: 59,
    operatingMarginPercent: 14,
    grossMarginPercent: 64,
    roePercent: 78,
    revenueGrowth5yPercent: 45,
    incomeGrowth5yPercent: 890,
    fcfGrowth5yPercent: 520,
    sharesChange5yPercent: -21,
    debtToFcfRatio: 0,
    fcfYieldPercent: 11,
    tier: 'crown-jewel',
    baseScore: 99,
    lastUpdated: '2024-12-27',
  },
  'NSIT': {
    symbol: 'NSIT',
    name: 'Insight Enterprises, Inc.',
    sector: 'Technology',
    industry: 'Electronics & Computer Distribution',
    marketCapB: 2.6,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 58,
    currentPE: 10.5,
    fairPE: 25,
    roic5yPercent: 56,
    operatingMarginPercent: 4.2,
    grossMarginPercent: 18,
    roePercent: 22,
    revenueGrowth5yPercent: 38,
    incomeGrowth5yPercent: 85,
    fcfGrowth5yPercent: 120,
    sharesChange5yPercent: -8,
    debtToFcfRatio: 1.5,
    fcfYieldPercent: 9,
    tier: 'crown-jewel',
    baseScore: 99,
    lastUpdated: '2024-12-27',
  },

  // =========================================================================
  // DIAMONDS (Score 85-94)
  // =========================================================================
  'VCTR': {
    symbol: 'VCTR',
    name: 'Victory Capital Holdings',
    sector: 'Financial Services',
    industry: 'Asset Management',
    marketCapB: 4.2,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 42,
    currentPE: 14.5,
    fairPE: 25,
    roic5yPercent: 77,
    operatingMarginPercent: 35,
    grossMarginPercent: 52,
    roePercent: 28,
    revenueGrowth5yPercent: 85,
    incomeGrowth5yPercent: 95,
    fcfGrowth5yPercent: 110,
    sharesChange5yPercent: -4.5,
    debtToFcfRatio: 3.0,
    fcfYieldPercent: 8,
    tier: 'diamond',
    baseScore: 91,
    lastUpdated: '2024-12-27',
  },
  'DKS': {
    symbol: 'DKS',
    name: "Dick's Sporting Goods",
    sector: 'Consumer Cyclical',
    industry: 'Sporting Goods',
    marketCapB: 17.0,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 42,
    currentPE: 14.5,
    fairPE: 25,
    roic5yPercent: 60,
    operatingMarginPercent: 12,
    grossMarginPercent: 35,
    roePercent: 42,
    revenueGrowth5yPercent: 55,
    incomeGrowth5yPercent: 180,
    fcfGrowth5yPercent: 95,
    sharesChange5yPercent: -18,
    debtToFcfRatio: 0.5,
    fcfYieldPercent: 7,
    tier: 'diamond',
    baseScore: 91,
    lastUpdated: '2024-12-27',
  },
  'SKX': {
    symbol: 'SKX',
    name: 'Skechers U.S.A.',
    sector: 'Consumer Cyclical',
    industry: 'Footwear & Accessories',
    marketCapB: 9.5,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 41,
    currentPE: 14.8,
    fairPE: 25,
    roic5yPercent: 16,
    operatingMarginPercent: 9,
    grossMarginPercent: 52,
    roePercent: 15,
    revenueGrowth5yPercent: 48,
    incomeGrowth5yPercent: 72,
    fcfGrowth5yPercent: 85,
    sharesChange5yPercent: -3,
    debtToFcfRatio: 0.8,
    fcfYieldPercent: 6,
    tier: 'diamond',
    baseScore: 90,
    lastUpdated: '2024-12-27',
  },
  'URBN': {
    symbol: 'URBN',
    name: 'Urban Outfitters',
    sector: 'Consumer Cyclical',
    industry: 'Apparel Retail',
    marketCapB: 6.9,
    qmScore: 8,
    qmPillars: {
      pe5y: true, roic5y: true, sharesDecreasing: true, fcfGrowing: true,
      incomeGrowing: true, revenueGrowing: true, debtLow: true, pfcf5y: true,
    },
    valueGapPercent: 31,
    currentPE: 17.3,
    fairPE: 25,
    roic5yPercent: 22,
    operatingMarginPercent: 10,
    grossMarginPercent: 34,
    roePercent: 19,
    revenueGrowth5yPercent: 25,
    incomeGrowth5yPercent: 65,
    fcfGrowth5yPercent: 78,
    sharesChange5yPercent: -7,
    debtToFcfRatio: 0,
    fcfYieldPercent: 8,
    tier: 'diamond',
    baseScore: 86,
    lastUpdated: '2024-12-27',
  },
};

// ============================================================================
// MAKRO SNAPSHOT - PÄIVITÄ TÄMÄ MARKKINATILANTEEN MUKAAN
// ============================================================================

export const MACRO_SNAPSHOT = {
  // Nykyinen ympäristö
  ...CURRENT_MACRO_ENVIRONMENT,

  // Tekstimuotoinen kuvaus asiakkaalle
  summary: `
Talousympäristö (${new Date().toLocaleDateString('fi-FI')}):

TALOUSSYKLI: Myöhäinen kasvuvaihe (Late Expansion)
- Talous edelleen vahva mutta hidastumassa
- Inflaatio laskussa mutta yhä yli tavoitteen (2.7%)
- Työmarkkinat vahvat (työttömyys 4.2%)

RAHAPOLITIIKKA: Kiristävä
- Fed funds rate: 4.5%
- QT jatkuu, taseen pienentäminen
- M2 rahan määrä laskussa (-2.5% YoY)

MARKKINASENTIMENTTI: Risk-on
- VIX matala (14), markkinat luottavaiset
- Tuloskausi vahva
- AI-teema jatkaa

SEKTORINÄKYMÄT (tämä ympäristö):
✓ SUOSII: Financials (hyötyy koroista), Energy, Healthcare
⚠ NEUTRAALI: Technology, Industrials
✗ HAASTAA: Real Estate (korkosensitiivinen), Utilities
`,

  // Sektorien ranking nykyisessä ympäristössä
  sectorRanking: [
    { sector: 'Financial Services', outlook: 'bullish', score: 78 },
    { sector: 'Energy', outlook: 'bullish', score: 75 },
    { sector: 'Healthcare', outlook: 'neutral', score: 62 },
    { sector: 'Consumer Defensive', outlook: 'neutral', score: 58 },
    { sector: 'Industrials', outlook: 'neutral', score: 55 },
    { sector: 'Technology', outlook: 'neutral', score: 52 },
    { sector: 'Consumer Cyclical', outlook: 'neutral', score: 48 },
    { sector: 'Basic Materials', outlook: 'neutral', score: 52 },
    { sector: 'Communication Services', outlook: 'neutral', score: 50 },
    { sector: 'Utilities', outlook: 'bearish', score: 38 },
    { sector: 'Real Estate', outlook: 'bearish', score: 32 },
  ],
};

// ============================================================================
// CLAUDE API PROMPT TEMPLATES
// ============================================================================

/**
 * Generoi syväanalyysi-prompt yhdelle osakkeelle
 */
export function generateSingleStockAnalysisPrompt(symbol: string): string {
  const stock = STOCK_DATABASE[symbol];
  if (!stock) {
    return `Osaketta ${symbol} ei löydy tietokannasta. Lisää se ensin STOCK_DATABASE muuttujaan.`;
  }

  const macroAdjusted = calculateMacroAdjustedScore(
    stock.baseScore,
    stock.sector,
    CURRENT_MACRO_ENVIRONMENT
  );

  return `
# Crown Jewel Syväanalyysi: ${stock.symbol}

## Rooli ja konteksti
Olet QualityMetrics-palvelun sijoitusanalyytikko. Tehtäväsi on tuottaa perusteellinen analyysi osakkeesta käyttäen alla olevaa dataa. Analyysisi on tarkoitettu maksaville asiakkaille jotka haluavat ymmärtää MIKSI tämä osake on Crown Jewel ja sopiiko se heidän salkkuunsa.

## Osakedata
- **Yhtiö**: ${stock.name} (${stock.symbol})
- **Sektori**: ${stock.sector}
- **Toimiala**: ${stock.industry}
- **Markkina-arvo**: $${stock.marketCapB}B

### Quality Metrics Score: ${stock.qmScore}/8
${Object.entries(stock.qmPillars).map(([key, passed]) =>
  `- ${key}: ${passed ? '✓' : '✗'}`
).join('\n')}

### Arvostus
- Nykyinen P/E: ${stock.currentPE}
- Fair P/E: ${stock.fairPE}
- **Value Gap: ${stock.valueGapPercent > 0 ? '+' : ''}${stock.valueGapPercent}%** ${stock.valueGapPercent > 30 ? '(Syvästi aliarvostettu)' : stock.valueGapPercent > 15 ? '(Aliarvostettu)' : ''}

### Laatu
- 5v ROIC: ${stock.roic5yPercent}%
- Operating Margin: ${stock.operatingMarginPercent}%
- Gross Margin: ${stock.grossMarginPercent}%
- ROE: ${stock.roePercent || 'N/A'}%

### Kasvu (5 vuotta)
- Liikevaihto: +${stock.revenueGrowth5yPercent}%
- Tulos: +${stock.incomeGrowth5yPercent}%
- FCF: +${stock.fcfGrowth5yPercent}%

### Pääoman allokaatio
- Osakkeiden muutos 5v: ${stock.sharesChange5yPercent}% ${stock.sharesChange5yPercent < 0 ? '(Takaisinostoja)' : ''}
- Debt/FCF: ${stock.debtToFcfRatio}x
- FCF Yield: ${stock.fcfYieldPercent}%

### Crown Jewel Status
- **Taso**: ${stock.tier.toUpperCase()}
- **Peruspisteet**: ${stock.baseScore}/100
- **Makro-adjusted pisteet**: ${macroAdjusted.adjustedScore}/100
- **Makrobonus**: ${macroAdjusted.macroBonus > 0 ? '+' : ''}${macroAdjusted.macroBonus}
- **Sektorinäkymä**: ${macroAdjusted.sectorOutlook}
- **Riskitaso**: ${macroAdjusted.riskLevel}

## Makroympäristö
${MACRO_SNAPSHOT.summary}

## Analyysiohjeet

Tuota analyysi seuraavassa rakenteessa:

### 1. YHTEENVETO (2-3 lausetta)
Miksi tämä on Crown Jewel? Mikä tekee siitä poikkeuksellisen?

### 2. LAADUN ANALYYSI
- Selitä ROIC-luku ja mitä se kertoo yhtiön kilpailuedusta
- Arvioi marginaalit suhteessa toimialaan
- Analysoi pääoman allokaatio (buybacks, velka)

### 3. ARVOSTUS
- Miksi Value Gap on näin suuri?
- Onko markkina väärässä vai onko jokin riski hinnoiteltu?
- Fair value -arvio perusteluineen

### 4. MAKRONÄKYMÄ
- Miten ${stock.sector} pärjää nykyisessä talousympäristössä?
- ${macroAdjusted.cycleFit}
- Mitä riskejä makroympäristö tuo?

### 5. RISKIT
- Listaa 3 suurinta riskiä
- Arvioi kunkin todennäköisyys ja vaikutus

### 6. SUOSITUS
- Kenelle tämä osake sopii?
- Millä aikavälillä tuotto-odotus?
- Toimenpidesuositus (Osta/Kerää/Pidä)

---
TÄRKEÄÄ: Analyysin tulee olla objektiivinen ja mainita sekä positiiviset että negatiiviset näkökohdat. Älä liioittele. Crown Jewel -status ei tarkoita riskitöntä sijoitusta.
`;
}

/**
 * Generoi vertailu-prompt kahdelle osakkeelle
 */
export function generateComparisonPrompt(symbol1: string, symbol2: string): string {
  const stock1 = STOCK_DATABASE[symbol1];
  const stock2 = STOCK_DATABASE[symbol2];

  if (!stock1 || !stock2) {
    return `Osake(ita) ei löydy tietokannasta.`;
  }

  const macro1 = calculateMacroAdjustedScore(stock1.baseScore, stock1.sector, CURRENT_MACRO_ENVIRONMENT);
  const macro2 = calculateMacroAdjustedScore(stock2.baseScore, stock2.sector, CURRENT_MACRO_ENVIRONMENT);

  return `
# Crown Jewel Vertailu: ${symbol1} vs ${symbol2}

## Rooli
Olet QualityMetrics-palvelun sijoitusanalyytikko. Vertaa näitä kahta Crown Jewel -osaketta ja anna selkeä suositus KUMPI on parempi valinta nykyisessä markkinaympäristössä.

## Osake 1: ${stock1.name} (${stock1.symbol})
- Sektori: ${stock1.sector}
- QM Score: ${stock1.qmScore}/8
- Value Gap: ${stock1.valueGapPercent}%
- 5v ROIC: ${stock1.roic5yPercent}%
- Peruspisteet: ${stock1.baseScore}
- Makro-adjusted: ${macro1.adjustedScore} (${macro1.macroBonus > 0 ? '+' : ''}${macro1.macroBonus})
- Sektorinäkymä: ${macro1.sectorOutlook}

## Osake 2: ${stock2.name} (${stock2.symbol})
- Sektori: ${stock2.sector}
- QM Score: ${stock2.qmScore}/8
- Value Gap: ${stock2.valueGapPercent}%
- 5v ROIC: ${stock2.roic5yPercent}%
- Peruspisteet: ${stock2.baseScore}
- Makro-adjusted: ${macro2.adjustedScore} (${macro2.macroBonus > 0 ? '+' : ''}${macro2.macroBonus})
- Sektorinäkymä: ${macro2.sectorOutlook}

## Makroympäristö
${MACRO_SNAPSHOT.summary}

## Vertailuohjeet

### 1. PÄÄHUOMIO
Kumpi voittaa ja miksi? (1 lause)

### 2. LAATU vs LAATU
- Kumman liiketoiminta on laadukkaampi?
- ROIC, marginaalit, kilpailuetu

### 3. ARVOSTUS vs ARVOSTUS
- Kumpi on halvempi suhteessa laatuun?
- Value Gap -analyysi

### 4. MAKROFIT
- Kumman sektori sopii paremmin nykyiseen ympäristöön?
- Miten tämä vaikuttaa valintaan?

### 5. RISKI/TUOTTO
- Kumpi tarjoaa paremman riski/tuotto-suhteen?

### 6. LOPULLINEN SUOSITUS
- **VOITTAJA**: [Osake] - syy 1 lauseessa
- Kenelle toinen osake silti sopii paremmin?
`;
}

/**
 * Generoi Top 5 Crown Jewels -katsaus
 */
export function generateTop5ReviewPrompt(): string {
  const topStocks = Object.values(STOCK_DATABASE)
    .filter(s => s.tier === 'crown-jewel' || s.tier === 'diamond')
    .sort((a, b) => b.baseScore - a.baseScore)
    .slice(0, 5);

  const stockSummaries = topStocks.map((s, i) => {
    const macro = calculateMacroAdjustedScore(s.baseScore, s.sector, CURRENT_MACRO_ENVIRONMENT);
    return `
${i + 1}. **${s.symbol}** (${s.name})
   - Sektori: ${s.sector}
   - Taso: ${s.tier}
   - Peruspisteet: ${s.baseScore} → Makro-adjusted: ${macro.adjustedScore}
   - Value Gap: ${s.valueGapPercent}%
   - QM: ${s.qmScore}/8, ROIC: ${s.roic5yPercent}%
   - Näkymä: ${macro.sectorOutlook}, Riski: ${macro.riskLevel}`;
  }).join('\n');

  return `
# Crown Jewels - Kuukauden Top 5 Katsaus

## Rooli
Olet QualityMetrics-palvelun pääanalyytikko. Tuota kuukausittainen katsaus viidestä parhaasta Crown Jewel -osakkeesta. Tämä menee premium-asiakkaille.

## Top 5 Osakkeet
${stockSummaries}

## Makroympäristö
${MACRO_SNAPSHOT.summary}

## Sektori-ranking nykyisessä ympäristössä
${MACRO_SNAPSHOT.sectorRanking.slice(0, 6).map(s =>
  `- ${s.sector}: ${s.outlook} (${s.score}/100)`
).join('\n')}

## Katsauksen rakenne

### 1. KUUKAUDEN PÄÄHUOMIO
Mikä on tärkein havainto? (2-3 lausetta)

### 2. OSAKEKOHTAISET HUOMIOT
Käy läpi jokainen osake lyhyesti:
- Miksi se on listalla?
- Mitä on muuttunut?
- Osta nyt vai odota?

### 3. SEKTORINÄKYMÄ
- Mitkä sektorit hyötyvät nykyisestä ympäristöstä?
- Miten tämä vaikuttaa Crown Jewels -valintoihin?

### 4. PORTFOLIO-SUOSITUS
Jos asiakas voi ostaa vain 2-3 näistä, mitkä?
- Konservatiivinen valinta: [X]
- Kasvuhakuinen valinta: [Y]
- Paras riski/tuotto: [Z]

### 5. VAROITUKSET
Mitä riskejä seurata?

---
Päivämäärä: ${new Date().toLocaleDateString('fi-FI')}
Seuraava päivitys: Kuukauden päästä
`;
}

/**
 * API-kutsu helper (käytä Anthropic SDK:ta)
 */
export async function callClaudeForAnalysis(
  prompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}

// ============================================================================
// EXPORT HELPERS
// ============================================================================

/**
 * Hae kaikki Crown Jewels makro-adjusteilla pisteillä
 */
export function getAllCrownJewelsRanked(): Array<CrownJewelStock & { adjustedScore: number; macroBonus: number }> {
  return Object.values(STOCK_DATABASE)
    .map(stock => {
      const macro = calculateMacroAdjustedScore(stock.baseScore, stock.sector, CURRENT_MACRO_ENVIRONMENT);
      return {
        ...stock,
        adjustedScore: macro.adjustedScore,
        macroBonus: macro.macroBonus,
      };
    })
    .sort((a, b) => b.adjustedScore - a.adjustedScore);
}

/**
 * Tulosta kaikki osakkeet konsoliin (debug)
 */
export function printStockDatabase(): void {
  console.log('='.repeat(80));
  console.log('CROWN JEWEL DATABASE');
  console.log('='.repeat(80));

  const ranked = getAllCrownJewelsRanked();

  console.log('Symbol  Tier          Base  Adj   Macro  Sector');
  console.log('-'.repeat(80));

  for (const s of ranked) {
    const tierIcon = s.tier === 'crown-jewel' ? '👑' : s.tier === 'diamond' ? '💎' : s.tier === 'gold' ? '🥇' : '🥈';
    console.log(
      `${s.symbol.padEnd(8)}${(tierIcon + ' ' + s.tier).padEnd(14)}` +
      `${s.baseScore.toString().padEnd(6)}${s.adjustedScore.toString().padEnd(6)}` +
      `${(s.macroBonus > 0 ? '+' : '') + s.macroBonus.toString().padEnd(7)}` +
      `${s.sector}`
    );
  }
}
