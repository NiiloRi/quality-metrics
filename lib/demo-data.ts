/**
 * Demo data for API enterprise application
 *
 * Fictional company names with realistic metrics
 * Activated via DEMO_MODE=true environment variable
 */

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// Fictional company name mappings
const FICTIONAL_COMPANIES: Record<string, { name: string; symbol: string }> = {
  // Technology
  'AAPL': { symbol: 'ACME', name: 'Acme Technologies Inc' },
  'MSFT': { symbol: 'NOVA', name: 'TechNova Corporation' },
  'GOOGL': { symbol: 'SRCH', name: 'SearchMax Global' },
  'META': { symbol: 'CONN', name: 'ConnectSphere Inc' },
  'NVDA': { symbol: 'CHIP', name: 'ChipMaster Systems' },
  'AMD': { symbol: 'PROC', name: 'ProCore Semiconductors' },
  'AVGO': { symbol: 'WAVE', name: 'WaveTech Industries' },
  'CRM': { symbol: 'CLUD', name: 'CloudFirst Solutions' },
  'ADBE': { symbol: 'CRTV', name: 'CreativeFlow Software' },
  'ORCL': { symbol: 'DBMS', name: 'DataCore Systems' },

  // Healthcare
  'JNJ': { symbol: 'HLTH', name: 'HealthPrime Corp' },
  'UNH': { symbol: 'CARE', name: 'CarePlus Holdings' },
  'PFE': { symbol: 'PHRM', name: 'PharmaCare Inc' },
  'ABBV': { symbol: 'BIOT', name: 'BioTech Innovations' },
  'MRK': { symbol: 'MEDX', name: 'MedExcel Labs' },
  'LLY': { symbol: 'CURE', name: 'CureGen Pharmaceuticals' },
  'TMO': { symbol: 'LABX', name: 'LabTech Instruments' },

  // Financial
  'JPM': { symbol: 'BNKR', name: 'BankerFirst Holdings' },
  'V': { symbol: 'PAYX', name: 'PayMax Networks' },
  'MA': { symbol: 'CRDT', name: 'CreditFlow Inc' },
  'BAC': { symbol: 'FINC', name: 'FinCore Banking' },
  'WFC': { symbol: 'WLTH', name: 'WealthGuard Bank' },
  'GS': { symbol: 'INVT', name: 'InvestPro Capital' },
  'MS': { symbol: 'MORG', name: 'Morgan Capital Group' },
  'BLK': { symbol: 'ASMT', name: 'AssetMax Management' },

  // Consumer
  'AMZN': { symbol: 'SHOP', name: 'ShopGlobal Inc' },
  'TSLA': { symbol: 'ELEC', name: 'ElectroDrive Motors' },
  'HD': { symbol: 'BLDG', name: 'BuildRight Stores' },
  'MCD': { symbol: 'FAST', name: 'FastBite Restaurants' },
  'NKE': { symbol: 'SPRT', name: 'SportMax Brands' },
  'SBUX': { symbol: 'BREW', name: 'BrewCraft Coffee' },
  'TGT': { symbol: 'RETL', name: 'RetailMax Corp' },
  'COST': { symbol: 'BULK', name: 'BulkMart Wholesale' },

  // Industrial
  'CAT': { symbol: 'EQIP', name: 'EquipMax Industries' },
  'DE': { symbol: 'AGRI', name: 'AgriTech Machinery' },
  'HON': { symbol: 'AUTO', name: 'AutoTech Systems' },
  'UPS': { symbol: 'SHIP', name: 'ShipFast Logistics' },
  'RTX': { symbol: 'AERO', name: 'AeroDefense Corp' },
  'GE': { symbol: 'POWE', name: 'PowerGen Industries' },
  'MMM': { symbol: 'INDU', name: 'IndustrialMax Corp' },

  // Energy
  'XOM': { symbol: 'FUEL', name: 'FuelCore Energy' },
  'CVX': { symbol: 'OILX', name: 'OilMax Resources' },
  'COP': { symbol: 'PETR', name: 'PetroGlobal Inc' },
  'SLB': { symbol: 'DRLL', name: 'DrillTech Services' },
  'EOG': { symbol: 'EXPL', name: 'ExploreEnergy Corp' },

  // Real Estate
  'PLD': { symbol: 'PROP', name: 'PropertyMax REIT' },
  'AMT': { symbol: 'TOWR', name: 'TowerNet Properties' },
  'EQIX': { symbol: 'DATA', name: 'DataCenter REIT' },
  'SPG': { symbol: 'MALL', name: 'MallPro Properties' },

  // Materials
  'LIN': { symbol: 'CHEM', name: 'ChemCore Industries' },
  'APD': { symbol: 'GASE', name: 'GaseTech Corp' },
  'SHW': { symbol: 'COAT', name: 'CoatMaster Paints' },
  'FCX': { symbol: 'MINE', name: 'MineTech Resources' },
  'NEM': { symbol: 'GOLD', name: 'GoldPeak Mining' },

  // Communication
  'DIS': { symbol: 'ENTM', name: 'EntertainMax Media' },
  'NFLX': { symbol: 'STRM', name: 'StreamPro Networks' },
  'CMCSA': { symbol: 'CABL', name: 'CableMax Communications' },
  'T': { symbol: 'TELC', name: 'TeleCom Global' },
  'VZ': { symbol: 'WIRE', name: 'WirelessMax Inc' },

  // Utilities
  'NEE': { symbol: 'RENW', name: 'RenewEnergy Corp' },
  'DUK': { symbol: 'GRID', name: 'GridPower Utilities' },
  'SO': { symbol: 'ELCT', name: 'ElectriCorp Southern' },
  'D': { symbol: 'DOMN', name: 'DominionPower Inc' },
};

// Sector name mappings for demo
const DEMO_SECTORS: Record<string, string> = {
  'Technology': 'Digital Solutions',
  'Healthcare': 'Life Sciences',
  'Financial Services': 'Capital Markets',
  'Consumer Cyclical': 'Consumer Goods',
  'Consumer Defensive': 'Essential Products',
  'Industrials': 'Manufacturing',
  'Energy': 'Resource Extraction',
  'Real Estate': 'Property Holdings',
  'Basic Materials': 'Raw Materials',
  'Communication Services': 'Media & Telecom',
  'Utilities': 'Infrastructure',
};

// Convert real stock data to demo data
export function convertToDemo<T extends { symbol?: string; name?: string; sector?: string }>(
  data: T
): T {
  if (!DEMO_MODE) return data;

  const result = { ...data };

  if (result.symbol && FICTIONAL_COMPANIES[result.symbol]) {
    const fictional = FICTIONAL_COMPANIES[result.symbol];
    result.symbol = fictional.symbol;
    result.name = fictional.name;
  } else if (result.symbol) {
    // Generate a generic demo name for unknown symbols
    result.symbol = `DMO${result.symbol.slice(0, 2)}`;
    result.name = `Demo Company ${result.symbol}`;
  }

  if (result.sector && DEMO_SECTORS[result.sector]) {
    result.sector = DEMO_SECTORS[result.sector];
  }

  return result;
}

// Convert an array of stock data to demo data
export function convertArrayToDemo<T extends { symbol?: string; name?: string; sector?: string }>(
  data: T[]
): T[] {
  if (!DEMO_MODE) return data;
  return data.map(item => convertToDemo(item));
}

// Get demo company info by real symbol
export function getDemoCompany(realSymbol: string): { symbol: string; name: string } | null {
  if (!DEMO_MODE) return null;
  return FICTIONAL_COMPANIES[realSymbol] || {
    symbol: `DMO${realSymbol.slice(0, 2)}`,
    name: `Demo Company ${realSymbol}`
  };
}

// Check if demo mode is active
export function isDemoMode(): boolean {
  return DEMO_MODE;
}

// Demo mode banner text
export function getDemoBannerText(): string | null {
  if (!DEMO_MODE) return null;
  return 'Demo Mode - Fictional data for demonstration purposes';
}

// Generate demo crown jewels data
export const DEMO_CROWN_JEWELS = [
  {
    symbol: 'ACME',
    name: 'Acme Technologies Inc',
    sector: 'Digital Solutions',
    industry: 'Software',
    marketCapB: 245.5,
    tier: 'crown-jewel' as const,
    baseScore: 92,
    adjustedScore: 95,
    macroBonus: 3,
    qmScore: 8,
    valueGapPercent: 45,
    roic5yPercent: 38,
    fcfYieldPercent: 8.5,
    revenueGrowth5yPercent: 22,
    incomeGrowth5yPercent: 28,
    sharesChange5yPercent: -12,
    hasBuybacks: true,
  },
  {
    symbol: 'CHIP',
    name: 'ChipMaster Systems',
    sector: 'Digital Solutions',
    industry: 'Semiconductors',
    marketCapB: 180.2,
    tier: 'diamond' as const,
    baseScore: 88,
    adjustedScore: 90,
    macroBonus: 2,
    qmScore: 8,
    valueGapPercent: 35,
    roic5yPercent: 42,
    fcfYieldPercent: 6.2,
    revenueGrowth5yPercent: 35,
    incomeGrowth5yPercent: 45,
    sharesChange5yPercent: -8,
    hasBuybacks: true,
  },
  {
    symbol: 'HLTH',
    name: 'HealthPrime Corp',
    sector: 'Life Sciences',
    industry: 'Pharmaceuticals',
    marketCapB: 320.1,
    tier: 'diamond' as const,
    baseScore: 85,
    adjustedScore: 87,
    macroBonus: 2,
    qmScore: 7,
    valueGapPercent: 28,
    roic5yPercent: 25,
    fcfYieldPercent: 7.1,
    revenueGrowth5yPercent: 12,
    incomeGrowth5yPercent: 15,
    sharesChange5yPercent: -5,
    hasBuybacks: true,
  },
  {
    symbol: 'BNKR',
    name: 'BankerFirst Holdings',
    sector: 'Capital Markets',
    industry: 'Banking',
    marketCapB: 450.8,
    tier: 'gold' as const,
    baseScore: 78,
    adjustedScore: 75,
    macroBonus: -3,
    qmScore: 7,
    valueGapPercent: 22,
    roic5yPercent: 15,
    fcfYieldPercent: 9.2,
    revenueGrowth5yPercent: 8,
    incomeGrowth5yPercent: 12,
    sharesChange5yPercent: -15,
    hasBuybacks: true,
  },
  {
    symbol: 'FUEL',
    name: 'FuelCore Energy',
    sector: 'Resource Extraction',
    industry: 'Oil & Gas',
    marketCapB: 380.5,
    tier: 'gold' as const,
    baseScore: 75,
    adjustedScore: 72,
    macroBonus: -3,
    qmScore: 6,
    valueGapPercent: 18,
    roic5yPercent: 18,
    fcfYieldPercent: 11.5,
    revenueGrowth5yPercent: 5,
    incomeGrowth5yPercent: 8,
    sharesChange5yPercent: -20,
    hasBuybacks: true,
  },
  {
    symbol: 'RENW',
    name: 'RenewEnergy Corp',
    sector: 'Infrastructure',
    industry: 'Renewable Energy',
    marketCapB: 145.2,
    tier: 'silver' as const,
    baseScore: 70,
    adjustedScore: 73,
    macroBonus: 3,
    qmScore: 6,
    valueGapPercent: 15,
    roic5yPercent: 12,
    fcfYieldPercent: 5.8,
    revenueGrowth5yPercent: 18,
    incomeGrowth5yPercent: 22,
    sharesChange5yPercent: 5,
    hasBuybacks: false,
  },
];

// Generate demo stocks for screener
export function generateDemoStocks(count: number = 50) {
  const sectors = Object.values(DEMO_SECTORS);
  const tiers = ['crown-jewel', 'diamond', 'gold', 'silver', null];
  const ratings = ['Strong Buy', 'Buy', 'Hold', 'Sell'];

  const stocks = [];
  const usedSymbols = new Set<string>();

  // First add mapped companies
  for (const [realSymbol, demo] of Object.entries(FICTIONAL_COMPANIES)) {
    if (stocks.length >= count) break;

    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const qmScore = Math.floor(Math.random() * 4) + 5; // 5-8
    const valueGap = Math.floor(Math.random() * 60) - 10; // -10 to 50

    stocks.push({
      symbol: demo.symbol,
      name: demo.name,
      sector,
      industry: `${sector} Industry`,
      market: 'US',
      data_source: 'Demo',
      market_cap: Math.floor(Math.random() * 500) * 1e9,
      price: Math.floor(Math.random() * 500) + 10,
      pe_ratio: Math.floor(Math.random() * 30) + 5,
      qm_score: qmScore,
      fair_pe: Math.floor(Math.random() * 25) + 10,
      value_gap: valueGap,
      valuation_status: valueGap > 15 ? 'undervalued' : valueGap < -15 ? 'overvalued' : 'fair',
      rating: ratings[Math.floor(Math.random() * ratings.length)],
      rating_score: Math.floor(Math.random() * 40) + 60,
      is_hidden_gem: qmScore >= 7 && valueGap > 20 ? 1 : 0,
    });

    usedSymbols.add(demo.symbol);
  }

  return stocks;
}
