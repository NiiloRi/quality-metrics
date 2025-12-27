/**
 * Full Universe Scanner
 *
 * Scans ALL available US stocks by:
 * 1. Fetching complete symbol list from FMP
 * 2. Filtering to likely common stocks
 * 3. Checking market cap via profile API
 * 4. Running full Crown Jewel analysis
 *
 * This takes many hours but finds ALL potential Hidden Gems.
 *
 * Usage: FMP_API_KEY=xxx npx tsx scripts/full-universe-scanner.ts
 *        FMP_API_KEY=xxx npx tsx scripts/full-universe-scanner.ts --resume  # Continue from last position
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const FMP_API_KEY = process.env.FMP_API_KEY;
const STABLE_URL = 'https://financialmodelingprep.com/stable';

// Scanning parameters
const MIN_MARKET_CAP = 500_000_000;    // $500M minimum
const MAX_MARKET_CAP = 50_000_000_000; // $50B max
const RATE_LIMIT_DELAY = 250;          // ms between API calls (4/sec to be safe)
const BATCH_SIZE = 5;                  // Symbols per batch for key data
const SAVE_INTERVAL = 50;              // Save progress every N stocks

// Progress file
const PROGRESS_FILE = path.join(process.cwd(), 'data', 'scan-progress.json');

// Command line args
const args = process.argv.slice(2);
const RESUME_MODE = args.includes('--resume');

interface StockSymbol {
  symbol: string;
  companyName: string;
}

interface ScanProgress {
  lastIndex: number;
  totalSymbols: number;
  scannedCount: number;
  hiddenGemsFound: number;
  startedAt: string;
  lastUpdated: string;
}

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API fetch with retry
async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.status === 429) {
        console.log('  ⚠️ Rate limit hit, waiting 60s...');
        await sleep(60000);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(5000);
    }
  }
}

// Check if symbol looks like a common stock
function isLikelyCommonStock(symbol: string, name: string): boolean {
  // Must be 1-5 letters only
  if (!/^[A-Z]{1,5}$/.test(symbol)) return false;

  // Exclude patterns
  const excludePatterns = [
    /ETF/i, /Fund/i, /Trust/i, /Index/i, /Notes/i,
    /Preferred/i, /Warrant/i, /Right/i, /Unit/i,
    /Series [A-Z]/i, /Class [A-Z]/i
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(name)) return false;
  }

  return true;
}

// Get all symbols from FMP
async function getAllSymbols(): Promise<StockSymbol[]> {
  console.log('Fetching complete stock list from FMP...');
  const data = await fetchWithRetry(`${STABLE_URL}/stock-list?apikey=${FMP_API_KEY}`);

  console.log(`Total symbols in FMP: ${data.length}`);

  // Filter to likely US common stocks
  const filtered = data.filter((s: StockSymbol) =>
    s.symbol && s.companyName && isLikelyCommonStock(s.symbol, s.companyName)
  );

  console.log(`Filtered to ${filtered.length} likely common stocks`);
  return filtered;
}

// Check if stock is in our market cap range
async function checkMarketCap(symbol: string): Promise<{ valid: boolean; marketCap: number; exchange: string }> {
  try {
    const data = await fetchWithRetry(`${STABLE_URL}/profile?symbol=${symbol}&apikey=${FMP_API_KEY}`);

    if (!data || !data[0]) {
      return { valid: false, marketCap: 0, exchange: '' };
    }

    const profile = data[0];
    const marketCap = profile.marketCap || 0;
    const exchange = profile.exchange || '';

    // Check if US exchange
    const usExchanges = ['NYSE', 'NASDAQ', 'AMEX', 'NYSE ARCA', 'NASDAQ Global Select', 'NYSE American'];
    const isUS = usExchanges.some(e => exchange.includes(e));

    if (!isUS) {
      return { valid: false, marketCap, exchange };
    }

    // Check market cap range
    const valid = marketCap >= MIN_MARKET_CAP && marketCap <= MAX_MARKET_CAP;
    return { valid, marketCap, exchange };
  } catch {
    return { valid: false, marketCap: 0, exchange: '' };
  }
}

// Get key metrics for a stock
async function getKeyMetrics(symbol: string): Promise<any> {
  try {
    const [ratios, growth, profile] = await Promise.all([
      fetchWithRetry(`${STABLE_URL}/ratios-ttm?symbol=${symbol}&apikey=${FMP_API_KEY}`),
      fetchWithRetry(`${STABLE_URL}/financial-growth?symbol=${symbol}&period=annual&limit=5&apikey=${FMP_API_KEY}`),
      fetchWithRetry(`${STABLE_URL}/profile?symbol=${symbol}&apikey=${FMP_API_KEY}`),
    ]);

    return {
      ratios: ratios?.[0] || {},
      growth: growth || [],
      profile: profile?.[0] || {},
    };
  } catch {
    return null;
  }
}

// Calculate QM score
function calculateQMScore(data: any): { score: number; pillars: Record<string, boolean> } {
  const { ratios, growth, profile } = data;

  const pillars: Record<string, boolean> = {
    pe5y: false,
    roic5y: false,
    sharesDecreasing: false,
    fcfGrowing: false,
    incomeGrowing: false,
    revenueGrowing: false,
    debtLow: false,
    pfcf5y: false,
  };

  // ROIC > 9%
  const roic = ratios.returnOnCapitalEmployedTTM || ratios.roicTTM || 0;
  pillars.roic5y = roic > 0.09;

  // Revenue growing (check 5y growth)
  if (growth.length >= 1) {
    const revenueGrowth = growth[0]?.revenueGrowth || 0;
    pillars.revenueGrowing = revenueGrowth > 0;
  }

  // Income growing
  if (growth.length >= 1) {
    const incomeGrowth = growth[0]?.netIncomeGrowth || 0;
    pillars.incomeGrowing = incomeGrowth > 0;
  }

  // FCF growing
  if (growth.length >= 1) {
    const fcfGrowth = growth[0]?.freeCashFlowGrowth || 0;
    pillars.fcfGrowing = fcfGrowth > 0;
  }

  // Low debt (Debt/Equity < 0.5 or Debt/FCF < 5)
  const debtEquity = ratios.debtEquityRatioTTM || 0;
  pillars.debtLow = debtEquity < 0.5;

  // P/E reasonable
  const pe = ratios.peRatioTTM || 0;
  pillars.pe5y = pe > 0 && pe < 22.5;

  // P/FCF reasonable
  const pfcf = ratios.priceToFreeCashFlowsRatioTTM || 0;
  pillars.pfcf5y = pfcf > 0 && pfcf < 22.5;

  // Shares decreasing (buybacks)
  // Would need historical shares data - approximate from growth
  pillars.sharesDecreasing = false; // Default, need more data

  const score = Object.values(pillars).filter(Boolean).length;
  return { score, pillars };
}

// Calculate tier based on score and value gap
function calculateTier(qmScore: number, valueGap: number): 'crown-jewel' | 'diamond' | 'gold' | 'silver' | null {
  if (qmScore >= 7 && valueGap >= 40) return 'crown-jewel';
  if (qmScore >= 6 && valueGap >= 30) return 'diamond';
  if (qmScore >= 5 && valueGap >= 20) return 'gold';
  if (qmScore >= 4 && valueGap >= 10) return 'silver';
  return null;
}

// Save to database
function saveToDatabase(db: Database.Database, stock: any) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO crown_jewels (
      symbol, name, sector, industry, market_cap_b, price,
      qm_score, pe5y_passes, roic5y_passes, shares_decreasing_passes,
      fcf_growing_passes, income_growing_passes, revenue_growing_passes,
      debt_low_passes, pfcf5y_passes, current_pe, fair_pe, value_gap_percent,
      roic5y_percent, operating_margin_percent, gross_margin_percent,
      roe_percent, revenue_growth_5y_percent, income_growth_5y_percent,
      fcf_growth_5y_percent, shares_change_5y_percent, debt_to_fcf_ratio,
      fcf_yield_percent, tier, confidence_score, growth_signals, scanned_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    stock.symbol,
    stock.name,
    stock.sector,
    stock.industry,
    stock.marketCapB,
    stock.price,
    stock.qmScore,
    stock.pillars.pe5y ? 1 : 0,
    stock.pillars.roic5y ? 1 : 0,
    stock.pillars.sharesDecreasing ? 1 : 0,
    stock.pillars.fcfGrowing ? 1 : 0,
    stock.pillars.incomeGrowing ? 1 : 0,
    stock.pillars.revenueGrowing ? 1 : 0,
    stock.pillars.debtLow ? 1 : 0,
    stock.pillars.pfcf5y ? 1 : 0,
    stock.currentPE,
    stock.fairPE,
    stock.valueGap,
    stock.roic,
    stock.operatingMargin,
    stock.grossMargin,
    stock.roe,
    stock.revenueGrowth,
    stock.incomeGrowth,
    stock.fcfGrowth,
    stock.sharesChange,
    stock.debtToFcf,
    stock.fcfYield,
    stock.tier,
    stock.confidenceScore,
    stock.growthSignals,
    new Date().toISOString()
  );
}

// Load/save progress
function loadProgress(): ScanProgress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveProgress(progress: ScanProgress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Main scanner
async function main() {
  console.log('======================================================================');
  console.log('FULL UNIVERSE SCANNER - Complete US Market Scan');
  console.log('======================================================================');
  console.log(`Target range: $${MIN_MARKET_CAP / 1e6}M - $${MAX_MARKET_CAP / 1e9}B`);
  console.log(`Rate limit: ${1000 / RATE_LIMIT_DELAY} requests/sec`);
  console.log('');

  if (!FMP_API_KEY) {
    console.error('❌ FMP_API_KEY environment variable required');
    process.exit(1);
  }

  // Open database
  const dbPath = path.join(process.cwd(), 'data', 'stocks.db');
  const db = new Database(dbPath);

  // Get all symbols
  const symbols = await getAllSymbols();

  // Check for resume
  let startIndex = 0;
  let progress: ScanProgress;

  if (RESUME_MODE) {
    const saved = loadProgress();
    if (saved && saved.totalSymbols === symbols.length) {
      startIndex = saved.lastIndex;
      progress = saved;
      console.log(`\n📂 Resuming from position ${startIndex}/${symbols.length}`);
    } else {
      progress = {
        lastIndex: 0,
        totalSymbols: symbols.length,
        scannedCount: 0,
        hiddenGemsFound: 0,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
    }
  } else {
    progress = {
      lastIndex: 0,
      totalSymbols: symbols.length,
      scannedCount: 0,
      hiddenGemsFound: 0,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };
  }

  console.log(`\nStarting scan of ${symbols.length - startIndex} symbols...`);
  console.log('This will take several hours. Progress is saved automatically.\n');

  let qualified = 0;
  let hiddenGems = 0;
  let processed = 0;

  for (let i = startIndex; i < symbols.length; i++) {
    const { symbol, companyName } = symbols[i];
    processed++;

    // Progress update every 100 stocks
    if (processed % 100 === 0) {
      const pct = ((i / symbols.length) * 100).toFixed(1);
      const elapsed = (Date.now() - new Date(progress.startedAt).getTime()) / 1000 / 60;
      const rate = processed / elapsed;
      const remaining = (symbols.length - i) / rate;
      console.log(`\n📊 Progress: ${i}/${symbols.length} (${pct}%) | Qualified: ${qualified} | Hidden Gems: ${hiddenGems}`);
      console.log(`   ⏱️ Elapsed: ${elapsed.toFixed(0)}min | ETA: ${remaining.toFixed(0)}min`);
    }

    // Check market cap first (quick filter)
    await sleep(RATE_LIMIT_DELAY);
    const mcCheck = await checkMarketCap(symbol);

    if (!mcCheck.valid) {
      continue; // Skip - wrong market cap or not US
    }

    qualified++;
    process.stdout.write(`\r  Scanning ${symbol}...                    `);

    // Get full metrics
    await sleep(RATE_LIMIT_DELAY);
    const metrics = await getKeyMetrics(symbol);

    if (!metrics) continue;

    const { ratios, growth, profile } = metrics;

    // Calculate QM score
    const { score: qmScore, pillars } = calculateQMScore(metrics);

    // Calculate value gap
    const currentPE = ratios.peRatioTTM || 0;
    const fairPE = 10 + (qmScore * 2.5); // Simple fair PE formula
    const valueGap = currentPE > 0 ? ((fairPE - currentPE) / fairPE) * 100 : 0;

    // Determine tier
    const tier = calculateTier(qmScore, valueGap);

    // Calculate confidence score
    const confidenceScore = qmScore * 10 + Math.min(valueGap, 50);

    // Save to database
    const stockData = {
      symbol,
      name: profile.companyName || companyName,
      sector: profile.sector || 'Unknown',
      industry: profile.industry || 'Unknown',
      marketCapB: mcCheck.marketCap / 1e9,
      price: profile.price || 0,
      qmScore,
      pillars,
      currentPE,
      fairPE,
      valueGap,
      roic: (ratios.returnOnCapitalEmployedTTM || 0) * 100,
      operatingMargin: (ratios.operatingProfitMarginTTM || 0) * 100,
      grossMargin: (ratios.grossProfitMarginTTM || 0) * 100,
      roe: (ratios.returnOnEquityTTM || 0) * 100,
      revenueGrowth: growth[0]?.revenueGrowth ? growth[0].revenueGrowth * 100 : null,
      incomeGrowth: growth[0]?.netIncomeGrowth ? growth[0].netIncomeGrowth * 100 : null,
      fcfGrowth: growth[0]?.freeCashFlowGrowth ? growth[0].freeCashFlowGrowth * 100 : null,
      sharesChange: null,
      debtToFcf: ratios.debtEquityRatioTTM || null,
      fcfYield: ratios.freeCashFlowYieldTTM ? ratios.freeCashFlowYieldTTM * 100 : null,
      tier,
      confidenceScore,
      growthSignals: [pillars.revenueGrowing, pillars.incomeGrowing, pillars.fcfGrowing].filter(Boolean).length,
    };

    saveToDatabase(db, stockData);

    if (tier) {
      hiddenGems++;
      const tierIcon = tier === 'crown-jewel' ? '👑' : tier === 'diamond' ? '💎' : tier === 'gold' ? '🥇' : '🥈';
      console.log(`\n  ${tierIcon} ${symbol}: ${tier.toUpperCase()} (QM: ${qmScore}/8, Gap: ${valueGap.toFixed(0)}%)`);
    }

    // Save progress periodically
    if (processed % SAVE_INTERVAL === 0) {
      progress.lastIndex = i + 1;
      progress.scannedCount = qualified;
      progress.hiddenGemsFound = hiddenGems;
      progress.lastUpdated = new Date().toISOString();
      saveProgress(progress);
    }
  }

  // Final stats
  console.log('\n');
  console.log('======================================================================');
  console.log('SCAN COMPLETE');
  console.log('======================================================================');
  console.log(`Total symbols checked: ${symbols.length}`);
  console.log(`Qualified (US, $500M-$50B): ${qualified}`);
  console.log(`Hidden Gems found: ${hiddenGems}`);

  // Get tier breakdown
  const stats = db.prepare(`
    SELECT tier, COUNT(*) as count
    FROM crown_jewels
    WHERE tier IS NOT NULL
    GROUP BY tier
  `).all() as { tier: string; count: number }[];

  console.log('\nTier breakdown:');
  for (const { tier, count } of stats) {
    const icon = tier === 'crown-jewel' ? '👑' : tier === 'diamond' ? '💎' : tier === 'gold' ? '🥇' : '🥈';
    console.log(`  ${icon} ${tier}: ${count}`);
  }

  // Clean up progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }

  db.close();
}

main().catch(console.error);
