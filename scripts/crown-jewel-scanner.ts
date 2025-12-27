/**
 * Crown Jewel Scanner
 *
 * Comprehensive scanner to find Crown Jewels across the entire US market.
 * Now fetches ALL available stocks from FMP API instead of using hardcoded list.
 *
 * Usage: FMP_API_KEY=xxx npx tsx scripts/crown-jewel-scanner.ts
 *        FMP_API_KEY=xxx npx tsx scripts/crown-jewel-scanner.ts --update  # Quick update (skip history)
 *        FMP_API_KEY=xxx npx tsx scripts/crown-jewel-scanner.ts --full    # Full rescan
 */

import * as path from 'path';
import Database from 'better-sqlite3';

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/stable';
const API_V3_URL = 'https://financialmodelingprep.com/api/v3';

// Scanning parameters
const MIN_MARKET_CAP = 500_000_000;   // $500M minimum
const MAX_MARKET_CAP = 50_000_000_000; // $50B max

// Command line args
const args = process.argv.slice(2);
const UPDATE_MODE = args.includes('--update');  // Quick update mode
const FULL_MODE = args.includes('--full');      // Full rescan mode

// Priority symbols to always include (fallback if API doesn't return them)
const PRIORITY_SYMBOLS = [
  // Tech
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'NVDA', 'AVGO', 'ORCL', 'CRM', 'CSCO',
  'ADBE', 'ACN', 'AMD', 'INTC', 'IBM', 'QCOM', 'TXN', 'NOW', 'INTU', 'AMAT',
  'MU', 'ADI', 'LRCX', 'KLAC', 'SNPS', 'CDNS', 'MRVL', 'NXPI', 'MCHP', 'ON',
  'FTNT', 'PANW', 'CRWD', 'ZS', 'NET', 'DDOG', 'SNOW', 'SPLK', 'OKTA', 'MDB',
  'TEAM', 'WDAY', 'HUBS', 'TTD', 'DOCU', 'ZM', 'TWLO', 'U', 'PATH', 'CFLT',
  // Consumer
  'AMZN', 'TSLA', 'HD', 'NKE', 'MCD', 'SBUX', 'TGT', 'LOW', 'TJX', 'ROST',
  'CMG', 'ORLY', 'AZO', 'BBY', 'DG', 'DLTR', 'ULTA', 'LULU', 'DECK', 'CROX',
  'GPS', 'ANF', 'URBN', 'SKX', 'FL', 'DKS', 'BOOT', 'HIBB', 'WSM', 'RH',
  'ETSY', 'EBAY', 'W', 'CHWY', 'CARG', 'CVNA', 'CPRT', 'KMX', 'AN', 'LAD',
  'BURL', 'FIVE', 'OLLI', 'PRTY', 'BIG', 'COST', 'WMT', 'KR', 'SYY', 'USFD',
  // Healthcare
  'UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY',
  'AMGN', 'GILD', 'VRTX', 'REGN', 'MRNA', 'BIIB', 'ILMN', 'DXCM', 'ISRG', 'EW',
  'MDT', 'SYK', 'BDX', 'BSX', 'ZBH', 'HOLX', 'IDXX', 'IQV', 'MTD', 'A',
  'WAT', 'PKI', 'TECH', 'WST', 'ALGN', 'TFX', 'STE', 'RMD', 'PODD', 'LIVN',
  // Finance
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'USB', 'PNC', 'TFC', 'SCHW',
  'BK', 'COF', 'AXP', 'V', 'MA', 'PYPL', 'SQ', 'FIS', 'FISV', 'GPN',
  'ADP', 'PAYX', 'BLK', 'SPGI', 'MCO', 'CME', 'ICE', 'NDAQ', 'CBOE', 'MSCI',
  'FDS', 'MORN', 'LPLA', 'RJF', 'SEIC', 'AMG', 'TROW', 'BEN', 'IVZ', 'JHG',
  // Industrial
  'CAT', 'DE', 'HON', 'RTX', 'BA', 'LMT', 'GD', 'NOC', 'GE', 'MMM',
  'UNP', 'UPS', 'FDX', 'CSX', 'NSC', 'JBHT', 'ODFL', 'SAIA', 'XPO', 'CHRW',
  'EMR', 'ROK', 'ETN', 'PH', 'ITW', 'SNA', 'TT', 'CMI', 'PCAR', 'FAST',
  'GWW', 'WSO', 'AOS', 'RRX', 'WCC', 'DOV', 'IEX', 'XYL', 'ROP', 'AME',
  // Energy
  'XOM', 'CVX', 'COP', 'EOG', 'SLB', 'MPC', 'PSX', 'VLO', 'OXY', 'PXD',
  'DVN', 'FANG', 'HES', 'HAL', 'BKR', 'NOV', 'CLR', 'MRO', 'APA', 'CTRA',
  'OVV', 'MGY', 'MTDR', 'PR', 'CHRD', 'SM', 'PDCE', 'VTLE', 'GPOR', 'RRC',
  // Materials
  'LIN', 'APD', 'SHW', 'ECL', 'DD', 'NEM', 'FCX', 'NUE', 'STLD', 'CLF',
  'X', 'AA', 'RS', 'ATI', 'CMC', 'MLM', 'VMC', 'MAS', 'BLD', 'OC',
  // Utilities/REIT
  'NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'XEL', 'PEG', 'ED',
  'WEC', 'ES', 'DTE', 'AEE', 'CMS', 'FE', 'EVRG', 'NI', 'NRG', 'PPL',
  // Communications
  'VZ', 'T', 'TMUS', 'CMCSA', 'CHTR', 'DIS', 'NFLX', 'WBD', 'PARA', 'FOX',
  'FOXA', 'OMC', 'IPG', 'ROKU', 'SPOT', 'LYV', 'MTCH', 'IAC', 'ZG', 'Z',
  // Hidden Gem candidates - mid-caps with potential
  'NSIT', 'VCTR', 'GPI', 'STRL', 'RUSHA', 'RUSHB', 'SIG', 'CATY', 'PATK', 'UFPI',
  'SMCI', 'ANET', 'ZBRA', 'CDW', 'EPAM', 'GLOB', 'EXLS', 'WNS', 'TASK', 'CRVL',
  'LSTR', 'JBSS', 'WERN', 'HTLD', 'ARCB', 'KNX', 'LSTR', 'MATX', 'HUBG', 'GXO',
  'EME', 'FIX', 'PWR', 'MTZ', 'STRL', 'ROCK', 'AAON', 'TRN', 'AQUA', 'FELE',
  'WTS', 'RBC', 'THR', 'PRIM', 'MASI', 'OMCL', 'AMPH', 'LNTH', 'SIGI', 'KMPR',
  'HMN', 'PLMR', 'JRVR', 'KLIC', 'FORM', 'POWI', 'DIOD', 'OSIS', 'NVMI', 'AOSL',
  // More mid-cap gems
  'PRGO', 'SUPN', 'TGTX', 'ITCI', 'SAVA', 'ARWR', 'FOLD', 'PTGX', 'AXON', 'CELH',
  'FRPT', 'BROS', 'WING', 'SHAK', 'TXRH', 'BJRI', 'EAT', 'CAKE', 'DENN', 'PLAY',
  'BTU', 'ARCH', 'CEIX', 'AMR', 'HCC', 'ARLP', 'CONSOL', 'SXC', 'METC', 'NC',

  // ========== EXPANDED MID-CAP UNIVERSE ==========

  // Technology - Software & IT Services
  'MANH', 'PAYC', 'PCTY', 'BILL', 'APPF', 'BRZE', 'ESTC', 'GTLB', 'SUMO', 'DT',
  'NTCT', 'BLKB', 'TENB', 'QLYS', 'RPD', 'SAIL', 'FROG', 'ENV', 'PEGA', 'PING',
  'CLVT', 'AGYS', 'PRFT', 'PDFS', 'ALTR', 'BSY', 'CWAN', 'QTWO', 'SPSC', 'PYCR',
  'APPS', 'FOUR', 'EVBG', 'JAMF', 'NEWR', 'DOCN', 'ALRM', 'PRGS', 'CALX', 'VIAV',

  // Technology - Semiconductors & Hardware
  'CRUS', 'SLAB', 'MPWR', 'SWKS', 'QRVO', 'LSCC', 'RMBS', 'ACLS', 'COHU', 'UCTT',
  'ONTO', 'IPGP', 'MKSI', 'CEVA', 'AMBA', 'WOLF', 'SITM', 'PLAB', 'VSH', 'SANM',
  'SMTC', 'SGH', 'ALGM', 'ICHR', 'AEHR', 'AMKR', 'TER', 'ENTG', 'MTSI', 'LITE',

  // Consumer Discretionary - Retail & Restaurants
  'PLNT', 'XPOF', 'FIZZ', 'COCO', 'LESL', 'GIII', 'SCVL', 'CATO', 'BWMX', 'WINA',
  'VFC', 'PVH', 'RL', 'LEVI', 'GOOS', 'SHOO', 'FOXF', 'BC', 'HOG', 'PII',
  'YETI', 'POOL', 'SITE', 'SUM', 'GMS', 'BLDR', 'TILE', 'FND', 'LL', 'ARHS',
  'ONEW', 'MCFT', 'HZO', 'CWH', 'WGO', 'THO', 'LCII', 'LCI', 'MBUU', 'REVG',

  // Consumer Discretionary - Auto & Parts
  'BWA', 'LEA', 'APTV', 'GNTX', 'VC', 'MOD', 'DAN', 'ALV', 'ADNT', 'AXL',
  'GTX', 'THRM', 'DOOR', 'SMP', 'CPS', 'MTOR', 'MNRO', 'ASGN', 'MYRG', 'GVA',

  // Industrials - Construction & Engineering
  'UFPI', 'BLDR', 'AZEK', 'TREX', 'AWI', 'CSWI', 'FBIN', 'ROCK', 'FELE', 'GTLS',
  'SPXC', 'RXO', 'ARCB', 'SAIA', 'WERN', 'HTLD', 'SNDR', 'MRTN', 'CVLG', 'ECHO',
  'EXPO', 'AAON', 'SPXS', 'WMS', 'BWXT', 'DY', 'ROAD', 'TGLS', 'HAYW', 'CNM',

  // Industrials - Aerospace & Defense
  'AXON', 'HEI', 'HII', 'TDG', 'HXL', 'SPR', 'CW', 'TGI', 'AJRD', 'ERJ',
  'MOG.A', 'ESAB', 'WWD', 'GFF', 'NPO', 'ALIT', 'ATI', 'KTOS', 'MRCY', 'CACI',

  // Industrials - Machinery & Equipment
  'GNRC', 'AGCO', 'CNHI', 'OSK', 'TTC', 'TEX', 'MIDD', 'CFX', 'RBC', 'AEIS',
  'LECO', 'ATKR', 'CLH', 'GTLS', 'KRNT', 'AZTA', 'CIR', 'FSS', 'LNN', 'REVG',

  // Healthcare - Medical Devices & Equipment
  'NUVA', 'GMED', 'TNDM', 'IART', 'ICUI', 'NVCR', 'ATRC', 'SILK', 'RXST', 'IRTC',
  'NVST', 'ITGR', 'GKOS', 'PRCT', 'SRDX', 'SWAV', 'AXNX', 'STAA', 'LNTH', 'NARI',

  // Healthcare - Pharma & Biotech
  'JAZZ', 'UTHR', 'EXEL', 'MEDP', 'RARE', 'ALNY', 'BMRN', 'HALO', 'SRPT', 'IONS',
  'PTCT', 'LEGN', 'RCKT', 'KRYS', 'NBIX', 'CORT', 'XENE', 'VKTX', 'RYTM', 'RVNC',

  // Healthcare - Services
  'ACHC', 'AMN', 'ENSG', 'NHC', 'SGRY', 'USPH', 'PDCO', 'PRSC', 'PNTG', 'SEM',

  // Financials - Banks
  'EWBC', 'HBAN', 'ZION', 'FNB', 'GBCI', 'UBSI', 'FFIN', 'ONB', 'PNFP', 'CBU',
  'BOKF', 'SBCF', 'WTFC', 'WSFS', 'ABCB', 'FIBK', 'TCBI', 'IBOC', 'INDB', 'SFNC',
  'NBTB', 'BANF', 'SFBS', 'HTLF', 'FULT', 'BHLB', 'WAFD', 'UMBF', 'COLB', 'OFG',

  // Financials - Insurance
  'AFG', 'AJG', 'WTM', 'THG', 'RYAN', 'BRO', 'KNSL', 'RNR', 'ASGN', 'HIG',
  'GL', 'PRI', 'SPNT', 'ACGL', 'CINF', 'ORI', 'ARGO', 'JRVR', 'PLMR', 'SIGI',

  // Financials - Asset Management & Investment
  'APAM', 'VRTS', 'BSIG', 'CG', 'HLNE', 'GHC', 'STEP', 'OWL', 'TPG', 'ARES',

  // Materials - Chemicals
  'CE', 'EMN', 'OLN', 'ASH', 'AVNT', 'AXTA', 'KWR', 'TROX', 'KOP', 'HWKN',
  'BCPC', 'CBT', 'FOE', 'GCP', 'HUN', 'IOSP', 'KRO', 'MEOH', 'MTX', 'NEU',

  // Materials - Metals & Mining
  'RGLD', 'WPM', 'FNV', 'GOLD', 'AEM', 'KGC', 'HL', 'CDE', 'AG', 'PAAS',
  'MAG', 'SSRM', 'EGO', 'BTG', 'IAG', 'NGD', 'SAND', 'OR', 'MUX', 'SVM',

  // Energy - Oil & Gas Services
  'FTI', 'WHD', 'LBRT', 'PUMP', 'PTEN', 'HP', 'RIG', 'VAL', 'WTTR', 'NR',
  'AROC', 'USAC', 'CIVI', 'TALO', 'ESTE', 'VNOM', 'DMLP', 'EPM', 'OAS', 'REI',

  // Energy - Utilities
  'OGE', 'PNW', 'AVA', 'IDA', 'BKH', 'NWE', 'POR', 'MGEE', 'SJW', 'AWR',
  'OTTR', 'MSEX', 'CWCO', 'YORW', 'ARTNA', 'CTWS', 'GWRS', 'SWX', 'NJR', 'SR',

  // Real Estate - REITs
  'FR', 'STAG', 'REXR', 'TRNO', 'EGP', 'LXP', 'COLD', 'IIPR', 'NSA', 'CUBE',
  'EXR', 'LSI', 'MAA', 'CPT', 'ESS', 'EQR', 'AVB', 'UDR', 'AIV', 'INVH',

  // Communications - Media & Entertainment
  'NXST', 'GTN', 'SSP', 'TGNA', 'SBGI', 'GCI', 'LEG', 'SCHL', 'DJCO', 'NYT',
  'WMG', 'LGF.A', 'LSXMA', 'FWONA', 'MSG', 'EDR', 'MSGS', 'LYV', 'BATRA', 'SIRI',

  // Additional Hidden Gem Candidates - Value Plays
  'TEX', 'ALLE', 'JELD', 'APOG', 'BECN', 'BFAM', 'CACI', 'CHDN', 'COHR', 'CSGP',
  'EXPO', 'FOXF', 'GTES', 'HNI', 'IPAR', 'KFY', 'LANC', 'LGIH', 'MASI', 'MGPI',
  'MTSI', 'NOVT', 'NSSC', 'NVT', 'PENN', 'PINC', 'PLTK', 'POST', 'QUOT', 'SCI',
  'SLGN', 'SMPL', 'SNEX', 'SPNS', 'STRA', 'TTMI', 'UDMY', 'VCYT', 'VECO', 'WK',
];

interface StockProfile {
  symbol: string;
  companyName: string;
  exchange: string;
  marketCap: number;
  sector: string;
  industry: string;
  isEtf: boolean;
  isAdr: boolean;
  isFund: boolean;
  isActivelyTrading: boolean;
}

interface CrownJewelData {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCapB: number;
  price: number;
  qmScore: number;
  pe5yPasses: boolean;
  roic5yPasses: boolean;
  sharesDecreasingPasses: boolean;
  fcfGrowingPasses: boolean;
  incomeGrowingPasses: boolean;
  revenueGrowingPasses: boolean;
  debtLowPasses: boolean;
  pfcf5yPasses: boolean;
  currentPE: number | null;
  pe5y: number | null;
  pfcf5y: number | null;
  fairPE: number;
  valueGapPercent: number | null;
  roic5yPercent: number | null;
  operatingMarginPercent: number | null;
  grossMarginPercent: number | null;
  roePercent: number | null;
  revenueGrowth5yPercent: number | null;
  incomeGrowth5yPercent: number | null;
  fcfGrowth5yPercent: number | null;
  sharesChange5yPercent: number | null;
  debtToFcfRatio: number | null;
  fcfYieldPercent: number | null;
  tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver' | null;
  confidenceScore: number;
  growthSignals: number;
  scannedAt: string;
}

async function fetchFMP<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const searchParams = new URLSearchParams({ ...params, apikey: FMP_API_KEY || '' });
  const url = `${BASE_URL}${endpoint}?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    throw new Error(`FMP API error: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all US stocks from FMP stock screener API
 * Returns ~3000-4000 stocks in the $500M-$50B market cap range
 */
async function getAllUSStocks(): Promise<string[]> {
  console.log('Fetching all US stocks from FMP API...');

  const params = new URLSearchParams({
    marketCapMoreThan: MIN_MARKET_CAP.toString(),
    marketCapLowerThan: MAX_MARKET_CAP.toString(),
    exchange: 'NYSE,NASDAQ,AMEX',
    isActivelyTrading: 'true',
    isEtf: 'false',
    isFund: 'false',
    apikey: FMP_API_KEY || '',
  });

  const url = `${API_V3_URL}/stock-screener?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`Stock screener API returned ${response.status}, using priority list`);
      return [...new Set(PRIORITY_SYMBOLS)];
    }

    const stocks = await response.json() as Array<{ symbol: string }>;

    if (!Array.isArray(stocks) || stocks.length === 0) {
      console.log('No stocks from screener, using priority list');
      return [...new Set(PRIORITY_SYMBOLS)];
    }

    // Extract symbols and add priority symbols to ensure coverage
    const apiSymbols = stocks.map((s: { symbol: string }) => s.symbol);
    const allSymbols = [...new Set([...apiSymbols, ...PRIORITY_SYMBOLS])];

    console.log(`Found ${apiSymbols.length} stocks from API + ${PRIORITY_SYMBOLS.length} priority = ${allSymbols.length} unique total`);
    return allSymbols;
  } catch (error) {
    console.log('Error fetching stocks, using priority list:', error);
    return [...new Set(PRIORITY_SYMBOLS)];
  }
}

async function getStockProfile(symbol: string): Promise<StockProfile | null> {
  try {
    const profiles = await fetchFMP<any[]>('/profile', { symbol });
    if (!profiles || profiles.length === 0) return null;

    const p = profiles[0];
    return {
      symbol: p.symbol,
      companyName: p.companyName || symbol,
      exchange: p.exchange || 'Unknown',
      marketCap: p.marketCap || 0,
      sector: p.sector || 'Unknown',
      industry: p.industry || 'Unknown',
      isEtf: p.isEtf || false,
      isAdr: p.isAdr || false,
      isFund: p.isFund || false,
      isActivelyTrading: p.isActivelyTrading !== false,
    };
  } catch {
    return null;
  }
}

function isValidUSStock(profile: StockProfile): boolean {
  const usExchanges = ['NYSE', 'NASDAQ', 'AMEX', 'NASDAQ Global Select', 'NYSE American'];
  return (
    usExchanges.some(ex => profile.exchange.includes(ex)) &&
    !profile.isEtf &&
    !profile.isAdr &&
    !profile.isFund &&
    profile.isActivelyTrading &&
    profile.marketCap >= MIN_MARKET_CAP &&
    profile.marketCap <= MAX_MARKET_CAP
  );
}

async function analyzeStock(symbol: string): Promise<CrownJewelData | null> {
  try {
    const [profile, quote, income, balance, cashFlow] = await Promise.all([
      fetchFMP<any[]>('/profile', { symbol }),
      fetchFMP<any[]>('/quote', { symbol }),
      fetchFMP<any[]>('/income-statement', { symbol, limit: '6' }),
      fetchFMP<any[]>('/balance-sheet-statement', { symbol, limit: '6' }),
      fetchFMP<any[]>('/cash-flow-statement', { symbol, limit: '6' }),
    ]);

    if (!profile[0] || !quote[0] || income.length < 2) return null;

    const p = profile[0];
    const q = quote[0];

    // Validate stock
    if (p.isEtf || p.isAdr || p.isFund) return null;
    if (q.marketCap < MIN_MARKET_CAP || q.marketCap > MAX_MARKET_CAP) return null;

    const latestIncome = income[0];
    const oldestIncome = income[Math.min(income.length - 1, 4)];
    const latestBalance = balance[0];
    const latestCF = cashFlow[0];
    const oldestCF = cashFlow[Math.min(cashFlow.length - 1, 4)];

    // Calculate 5-year cumulative metrics
    const incomeSlice = income.slice(0, 5);
    const cfSlice = cashFlow.slice(0, 5);

    const totalNI = incomeSlice.reduce((s: number, i: any) => s + (i.netIncome || 0), 0);
    const totalFCF = cfSlice.reduce((s: number, c: any) => s + (c.freeCashFlow || 0), 0);

    const avgInvestedCapital = balance.slice(0, 5).reduce((s: number, b: any) => {
      return s + ((b.totalStockholdersEquity || 0) + (b.totalDebt || 0));
    }, 0) / Math.min(balance.length, 5);

    const roic5y = avgInvestedCapital > 0 ? (totalFCF / 5 / avgInvestedCapital) * 100 : null;
    const operatingMargin = latestIncome.revenue > 0
      ? (latestIncome.operatingIncome / latestIncome.revenue) * 100 : null;
    const grossMargin = latestIncome.revenue > 0
      ? (latestIncome.grossProfit / latestIncome.revenue) * 100 : null;
    const roe = latestBalance?.totalStockholdersEquity > 0
      ? (latestIncome.netIncome / latestBalance.totalStockholdersEquity) * 100 : null;

    const pe5y = totalNI > 0 ? q.marketCap / totalNI : null;
    const pfcf5y = totalFCF > 0 ? q.marketCap / totalFCF : null;
    const currentPE = latestIncome.netIncome > 0 ? q.marketCap / latestIncome.netIncome : null;

    const currentShares = latestIncome.weightedAverageShsOut || 0;
    const oldShares = oldestIncome?.weightedAverageShsOut || 0;
    const sharesChange5y = oldShares > 0 ? ((currentShares - oldShares) / oldShares) * 100 : null;

    const avgFCF = totalFCF / Math.min(cfSlice.length, 5);
    const debtToFcf = avgFCF > 0 ? (latestBalance?.longTermDebt || 0) / avgFCF : null;
    const fcfYield = q.marketCap > 0 && latestCF?.freeCashFlow > 0
      ? (latestCF.freeCashFlow / q.marketCap) * 100 : null;

    const revenueGrowth5y = oldestIncome?.revenue > 0
      ? ((latestIncome.revenue - oldestIncome.revenue) / oldestIncome.revenue) * 100 : null;
    const incomeGrowth5y = oldestIncome?.netIncome > 0
      ? ((latestIncome.netIncome - oldestIncome.netIncome) / Math.abs(oldestIncome.netIncome)) * 100 : null;
    const fcfGrowth5y = oldestCF?.freeCashFlow > 0
      ? ((latestCF.freeCashFlow - oldestCF.freeCashFlow) / Math.abs(oldestCF.freeCashFlow)) * 100 : null;

    // QM Score
    let qmScore = 0;
    const pe5yPasses = pe5y !== null && pe5y > 0 && pe5y < 22.5;
    if (pe5yPasses) qmScore++;
    const roic5yPasses = roic5y !== null && roic5y > 9;
    if (roic5yPasses) qmScore++;
    const sharesDecreasingPasses = sharesChange5y !== null && sharesChange5y <= 0;
    if (sharesDecreasingPasses) qmScore++;
    const fcfGrowingPasses = latestCF?.freeCashFlow > (oldestCF?.freeCashFlow || 0) && latestCF?.freeCashFlow > 0;
    if (fcfGrowingPasses) qmScore++;
    const incomeGrowingPasses = latestIncome.netIncome > (oldestIncome?.netIncome || 0) && latestIncome.netIncome > 0;
    if (incomeGrowingPasses) qmScore++;
    const revenueGrowingPasses = latestIncome.revenue > (oldestIncome?.revenue || 0);
    if (revenueGrowingPasses) qmScore++;
    const debtLowPasses = debtToFcf !== null && debtToFcf < 5 && debtToFcf >= 0;
    if (debtLowPasses) qmScore++;
    const pfcf5yPasses = pfcf5y !== null && pfcf5y > 0 && pfcf5y < 22.5;
    if (pfcf5yPasses) qmScore++;

    // Valuation
    const fairPE = 8 + (qmScore / 8) * 17;
    const valueGap = currentPE !== null && currentPE > 0
      ? ((fairPE - currentPE) / fairPE) * 100 : null;

    // Crown Jewel Scoring
    const qmContribution = (qmScore / 8) * 40;
    const valueGapContribution = valueGap !== null && valueGap > 0
      ? Math.min(30, (valueGap / 60) * 30) : 0;
    const growthSignals = [fcfGrowingPasses, incomeGrowingPasses, revenueGrowingPasses].filter(Boolean).length;
    const growthContribution = growthSignals * 6.67;
    const buybackContribution = sharesDecreasingPasses ? 10 : 0;
    let confidenceScore = Math.round(qmContribution + valueGapContribution + growthContribution + buybackContribution);

    // Tier
    let tier: 'crown-jewel' | 'diamond' | 'gold' | 'silver' | null = null;
    if (growthSignals > 0 && qmScore >= 6 && valueGap !== null && valueGap > 15 && latestCF?.freeCashFlow > 0) {
      if (confidenceScore >= 95) tier = 'crown-jewel';
      else if (confidenceScore >= 85 && qmScore >= 8 && growthSignals >= 3 && valueGap >= 30) tier = 'diamond';
      else if (confidenceScore >= 70 && qmScore >= 7 && growthSignals >= 2 && valueGap >= 20) tier = 'gold';
      else if (confidenceScore >= 55 && qmScore >= 6 && growthSignals >= 1 && valueGap >= 15) tier = 'silver';
    }

    return {
      symbol,
      name: p.companyName || q.name || symbol,
      sector: p.sector || 'Unknown',
      industry: p.industry || 'Unknown',
      marketCapB: Math.round(q.marketCap / 1_000_000_000 * 100) / 100,
      price: q.price,
      qmScore,
      pe5yPasses, roic5yPasses, sharesDecreasingPasses, fcfGrowingPasses,
      incomeGrowingPasses, revenueGrowingPasses, debtLowPasses, pfcf5yPasses,
      currentPE, pe5y, pfcf5y, fairPE,
      valueGapPercent: valueGap !== null ? Math.round(valueGap * 10) / 10 : null,
      roic5yPercent: roic5y !== null ? Math.round(roic5y * 10) / 10 : null,
      operatingMarginPercent: operatingMargin !== null ? Math.round(operatingMargin * 10) / 10 : null,
      grossMarginPercent: grossMargin !== null ? Math.round(grossMargin * 10) / 10 : null,
      roePercent: roe !== null ? Math.round(roe * 10) / 10 : null,
      revenueGrowth5yPercent: revenueGrowth5y !== null ? Math.round(revenueGrowth5y) : null,
      incomeGrowth5yPercent: incomeGrowth5y !== null ? Math.round(incomeGrowth5y) : null,
      fcfGrowth5yPercent: fcfGrowth5y !== null ? Math.round(fcfGrowth5y) : null,
      sharesChange5yPercent: sharesChange5y !== null ? Math.round(sharesChange5y * 10) / 10 : null,
      debtToFcfRatio: debtToFcf !== null ? Math.round(debtToFcf * 10) / 10 : null,
      fcfYieldPercent: fcfYield !== null ? Math.round(fcfYield * 10) / 10 : null,
      tier,
      confidenceScore,
      growthSignals,
      scannedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT') throw error;
    return null;
  }
}

function setupDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS crown_jewels (
      symbol TEXT PRIMARY KEY,
      name TEXT, sector TEXT, industry TEXT, market_cap_b REAL, price REAL,
      qm_score INTEGER, pe5y_passes INTEGER, roic5y_passes INTEGER,
      shares_decreasing_passes INTEGER, fcf_growing_passes INTEGER,
      income_growing_passes INTEGER, revenue_growing_passes INTEGER,
      debt_low_passes INTEGER, pfcf5y_passes INTEGER,
      current_pe REAL, pe5y REAL, pfcf5y REAL, fair_pe REAL, value_gap_percent REAL,
      roic5y_percent REAL, operating_margin_percent REAL, gross_margin_percent REAL, roe_percent REAL,
      revenue_growth_5y_percent REAL, income_growth_5y_percent REAL, fcf_growth_5y_percent REAL,
      shares_change_5y_percent REAL, debt_to_fcf_ratio REAL, fcf_yield_percent REAL,
      tier TEXT, confidence_score INTEGER, growth_signals INTEGER, scanned_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_cj_tier ON crown_jewels(tier);
    CREATE INDEX IF NOT EXISTS idx_cj_confidence ON crown_jewels(confidence_score DESC);
    CREATE INDEX IF NOT EXISTS idx_cj_qm ON crown_jewels(qm_score DESC);
    CREATE INDEX IF NOT EXISTS idx_cj_sector ON crown_jewels(sector);
  `);
  return db;
}

function saveStock(db: Database.Database, data: CrownJewelData): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO crown_jewels (
      symbol, name, sector, industry, market_cap_b, price,
      qm_score, pe5y_passes, roic5y_passes, shares_decreasing_passes,
      fcf_growing_passes, income_growing_passes, revenue_growing_passes,
      debt_low_passes, pfcf5y_passes,
      current_pe, pe5y, pfcf5y, fair_pe, value_gap_percent,
      roic5y_percent, operating_margin_percent, gross_margin_percent, roe_percent,
      revenue_growth_5y_percent, income_growth_5y_percent, fcf_growth_5y_percent,
      shares_change_5y_percent, debt_to_fcf_ratio, fcf_yield_percent,
      tier, confidence_score, growth_signals, scanned_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.symbol, data.name, data.sector, data.industry, data.marketCapB, data.price,
    data.qmScore, data.pe5yPasses ? 1 : 0, data.roic5yPasses ? 1 : 0, data.sharesDecreasingPasses ? 1 : 0,
    data.fcfGrowingPasses ? 1 : 0, data.incomeGrowingPasses ? 1 : 0, data.revenueGrowingPasses ? 1 : 0,
    data.debtLowPasses ? 1 : 0, data.pfcf5yPasses ? 1 : 0,
    data.currentPE, data.pe5y, data.pfcf5y, data.fairPE, data.valueGapPercent,
    data.roic5yPercent, data.operatingMarginPercent, data.grossMarginPercent, data.roePercent,
    data.revenueGrowth5yPercent, data.incomeGrowth5yPercent, data.fcfGrowth5yPercent,
    data.sharesChange5yPercent, data.debtToFcfRatio, data.fcfYieldPercent,
    data.tier, data.confidenceScore, data.growthSignals, data.scannedAt
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('='.repeat(70));
  console.log('CROWN JEWEL SCANNER - Full Market Scan');
  console.log('='.repeat(70));
  console.log(`Mode: ${UPDATE_MODE ? 'UPDATE (quick)' : FULL_MODE ? 'FULL (rescan all)' : 'NORMAL (skip scanned today)'}`);
  console.log(`Target range: $${MIN_MARKET_CAP / 1e6}M - $${MAX_MARKET_CAP / 1e9}B`);

  if (!FMP_API_KEY) {
    console.error('Error: FMP_API_KEY environment variable required');
    process.exit(1);
  }

  const dbPath = path.join(__dirname, '..', 'data', 'stocks.db');
  const db = setupDatabase(dbPath);
  console.log(`Database: ${dbPath}`);

  // Get all available stocks from API
  const allSymbols = await getAllUSStocks();
  console.log(`Total stocks to consider: ${allSymbols.length}`);

  // Determine which stocks to scan based on mode
  let toScan: string[] = [];

  if (FULL_MODE) {
    // Full rescan - scan everything
    toScan = allSymbols;
    console.log(`Full mode: scanning all ${toScan.length} stocks`);
  } else if (UPDATE_MODE) {
    // Update mode - scan only stocks not scanned in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const recentlyScanned = db.prepare(`
      SELECT symbol FROM crown_jewels WHERE date(scanned_at) >= ?
    `).all(weekAgoStr) as { symbol: string }[];
    const recentSymbols = new Set(recentlyScanned.map(r => r.symbol));

    toScan = allSymbols.filter(s => !recentSymbols.has(s));
    console.log(`Update mode: ${recentSymbols.size} scanned in last 7 days, ${toScan.length} new/stale stocks to scan`);
  } else {
    // Normal mode - skip stocks scanned today
    const today = new Date().toISOString().split('T')[0];
    const scannedToday = db.prepare(`
      SELECT symbol FROM crown_jewels WHERE date(scanned_at) = ?
    `).all(today) as { symbol: string }[];
    const scannedSymbols = new Set(scannedToday.map(r => r.symbol));

    toScan = allSymbols.filter(s => !scannedSymbols.has(s));
    console.log(`Already scanned today: ${scannedSymbols.size} stocks`);
    console.log(`Stocks to scan: ${toScan.length}`);
  }

  console.log('');

  let scanned = 0;
  let hiddenGems = 0;
  const tierCounts = { 'crown-jewel': 0, 'diamond': 0, 'gold': 0, 'silver': 0 };

  const BATCH_SIZE = 5;
  const DELAY_BETWEEN = 300;

  for (let i = 0; i < toScan.length; i += BATCH_SIZE) {
    const batch = toScan.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(toScan.length / BATCH_SIZE);

    console.log(`Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`);

    for (const symbol of batch) {
      try {
        const result = await analyzeStock(symbol);
        if (result) {
          saveStock(db, result);
          scanned++;
          if (result.tier) {
            hiddenGems++;
            tierCounts[result.tier]++;
            const icon = result.tier === 'crown-jewel' ? '👑' :
                        result.tier === 'diamond' ? '💎' :
                        result.tier === 'gold' ? '🥇' : '🥈';
            console.log(`  ${icon} ${symbol}: ${result.tier.toUpperCase()} (score: ${result.confidenceScore}, QM: ${result.qmScore}/8, Gap: ${result.valueGapPercent}%)`);
          }
        }
        await sleep(DELAY_BETWEEN);
      } catch (error: any) {
        if (error.message === 'RATE_LIMIT') {
          console.log('  ⚠️ Rate limit hit, waiting 60s...');
          await sleep(60000);
          i -= BATCH_SIZE;
          break;
        }
        console.log(`  ✗ ${symbol}: ${error.message}`);
      }
    }

    if (batchNum % 10 === 0) {
      console.log(`\n📊 Progress: ${scanned} scanned, ${hiddenGems} hidden gems`);
      console.log(`   👑 ${tierCounts['crown-jewel']} | 💎 ${tierCounts['diamond']} | 🥇 ${tierCounts['gold']} | 🥈 ${tierCounts['silver']}\n`);
    }

    await sleep(1500);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SCAN COMPLETE');
  console.log('='.repeat(70));
  console.log(`Total scanned: ${scanned}`);
  console.log(`Hidden Gems: ${hiddenGems}`);
  console.log(`  👑 Crown Jewels: ${tierCounts['crown-jewel']}`);
  console.log(`  💎 Diamonds: ${tierCounts['diamond']}`);
  console.log(`  🥇 Gold: ${tierCounts['gold']}`);
  console.log(`  🥈 Silver: ${tierCounts['silver']}`);

  const topJewels = db.prepare(`
    SELECT symbol, name, sector, tier, confidence_score, qm_score, value_gap_percent
    FROM crown_jewels WHERE tier IS NOT NULL ORDER BY confidence_score DESC LIMIT 20
  `).all() as any[];

  if (topJewels.length > 0) {
    console.log('\n--- TOP 20 HIDDEN GEMS ---');
    topJewels.forEach((gem, i) => {
      const icon = gem.tier === 'crown-jewel' ? '👑' :
                   gem.tier === 'diamond' ? '💎' :
                   gem.tier === 'gold' ? '🥇' : '🥈';
      console.log(`${(i + 1).toString().padStart(2)}. ${icon} ${gem.symbol.padEnd(6)} Score: ${gem.confidence_score} | QM: ${gem.qm_score}/8 | Gap: ${gem.value_gap_percent?.toFixed(0)}% | ${gem.sector}`);
    });
  }

  db.close();
}

main().catch(console.error);
