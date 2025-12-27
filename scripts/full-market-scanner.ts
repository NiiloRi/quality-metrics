/**
 * Full Market Scanner
 *
 * Scans all US stocks to build a comprehensive Hidden Gem catalog.
 * Identifies Crown Jewels (top 5 highest scoring Hidden Gems).
 *
 * Usage: FMP_API_KEY=xxx npx tsx scripts/full-market-scanner.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const FMP_API_KEY = process.env.FMP_API_KEY;
const BASE_URL = 'https://financialmodelingprep.com/stable';

// Minimum requirements for scanning
const MIN_MARKET_CAP = 500_000_000; // $500M minimum
const MAX_MARKET_CAP = 50_000_000_000; // $50B max for Hidden Gem

interface StockListItem {
  symbol: string;
  name: string;
  exchange: string;
  exchangeShortName: string;
  type: string;
}

interface ScanResult {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: number;
  qmScore: number;
  roic5y: number | null;
  operatingMargin: number | null;
  valueGap: number | null;
  growthSignals: number;
  sharesChange5y: number | null;
  debtToFcf: number | null;
  hiddenGemTier: string | null;
  confidenceScore: number;
  recommendation: string;
  scannedAt: string;
}

interface CatalogData {
  lastUpdated: string;
  totalScanned: number;
  hiddenGemsCount: number;
  crownJewels: ScanResult[];
  diamonds: ScanResult[];
  golds: ScanResult[];
  silvers: ScanResult[];
  allResults: ScanResult[];
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

async function getUSStocks(): Promise<StockListItem[]> {
  console.log('Fetching US stock list...');
  const stocks = await fetchFMP<StockListItem[]>('/stock-list');

  // Filter to US exchanges and common stocks only
  const usStocks = stocks.filter(s =>
    ['NYSE', 'NASDAQ', 'AMEX'].includes(s.exchangeShortName) &&
    s.type === 'stock' &&
    !s.symbol.includes('.') && // Exclude ADRs with dots
    !s.symbol.includes('-') // Exclude preferred shares
  );

  console.log(`Found ${usStocks.length} US stocks`);
  return usStocks;
}

async function analyzeStock(symbol: string): Promise<ScanResult | null> {
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

    // Skip if outside market cap range
    if (q.marketCap < MIN_MARKET_CAP || q.marketCap > MAX_MARKET_CAP) {
      return null;
    }

    const latestIncome = income[0];
    const oldestIncome = income[income.length - 1];
    const latestBalance = balance[0];
    const latestCF = cashFlow[0];
    const oldestCF = cashFlow[cashFlow.length - 1];

    // Calculate 5-year metrics
    const totalNI = income.slice(0, 5).reduce((s: number, i: any) => s + (i.netIncome || 0), 0);
    const totalFCF = cashFlow.slice(0, 5).reduce((s: number, c: any) => s + (c.freeCashFlow || 0), 0);
    const investedCapital = (latestBalance?.totalStockholdersEquity || 0) + (latestBalance?.totalDebt || 0);

    const roic5y = investedCapital > 0 ? (totalFCF / investedCapital) * 100 : null;
    const operatingMargin = latestIncome.revenue > 0
      ? (latestIncome.operatingIncome / latestIncome.revenue) * 100 : null;

    // Valuation
    const pe = latestIncome.netIncome > 0 ? q.marketCap / latestIncome.netIncome : null;
    const currentShares = latestIncome.weightedAverageShsOut;
    const oldShares = oldestIncome?.weightedAverageShsOut;
    const sharesChange5y = oldShares && currentShares
      ? ((currentShares - oldShares) / oldShares) * 100 : null;
    const avgFCF = totalFCF / Math.min(5, cashFlow.length);
    const debtToFcf = avgFCF > 0 ? (latestBalance?.longTermDebt || 0) / avgFCF : null;

    // Calculate QM Score
    let qmScore = 0;
    const pe5y = totalNI > 0 ? q.marketCap / totalNI : null;
    const pfcf5y = totalFCF > 0 ? q.marketCap / totalFCF : null;

    if (pe5y && pe5y > 0 && pe5y < 22.5) qmScore++;
    if (roic5y && roic5y > 9) qmScore++;
    if (sharesChange5y !== null && sharesChange5y <= 0) qmScore++;
    if (latestCF?.freeCashFlow > (oldestCF?.freeCashFlow || 0) && latestCF?.freeCashFlow > 0) qmScore++;
    if (latestIncome.netIncome > (oldestIncome?.netIncome || 0) && latestIncome.netIncome > 0) qmScore++;
    if (latestIncome.revenue > (oldestIncome?.revenue || 0)) qmScore++;
    if (debtToFcf !== null && debtToFcf < 5) qmScore++;
    if (pfcf5y && pfcf5y > 0 && pfcf5y < 22.5) qmScore++;

    // Value gap
    const fairPE = 8 + (qmScore / 8) * 17;
    const valueGap = pe && pe > 0 ? ((fairPE - pe) / fairPE) * 100 : null;

    // Growth signals
    const fcfGrowing = latestCF?.freeCashFlow > (oldestCF?.freeCashFlow || 0) && latestCF?.freeCashFlow > 0;
    const incomeGrowing = latestIncome.netIncome > (oldestIncome?.netIncome || 0) && latestIncome.netIncome > 0;
    const revenueGrowing = latestIncome.revenue > (oldestIncome?.revenue || 0);
    const growthSignals = [fcfGrowing, incomeGrowing, revenueGrowing].filter(Boolean).length;
    const sharesDecreasing = sharesChange5y !== null && sharesChange5y <= 0;

    // Calculate confidence score (same formula as in qm-calculator.ts)
    const qmContribution = (qmScore / 8) * 40;
    const valueGapContribution = valueGap !== null ? Math.min(30, (valueGap / 60) * 30) : 0;
    const growthContribution = growthSignals * 6.67;
    const buybackContribution = sharesDecreasing ? 10 : 0;
    let confidenceScore = qmContribution + valueGapContribution + growthContribution + buybackContribution;

    // Determine tier
    let hiddenGemTier: string | null = null;
    let recommendation = '';

    if (growthSignals > 0 && qmScore >= 6 && valueGap !== null && valueGap > 15 && latestCF?.freeCashFlow > 0) {
      if (confidenceScore >= 95) {
        hiddenGemTier = 'crown-jewel';
        recommendation = '👑 Crown Jewel - Elite opportunity';
      } else if (confidenceScore >= 85 && qmScore >= 8 && growthSignals >= 3 && valueGap >= 30) {
        hiddenGemTier = 'diamond';
        recommendation = '💎 Strong Buy - Premium quality';
      } else if (confidenceScore >= 70 && qmScore >= 7 && growthSignals >= 2 && valueGap >= 20) {
        hiddenGemTier = 'gold';
        recommendation = '🥇 Buy - High quality';
      } else if (confidenceScore >= 55 && qmScore >= 6 && growthSignals >= 1 && valueGap >= 15) {
        hiddenGemTier = 'silver';
        recommendation = '🥈 Accumulate - Good quality';
      }
    }

    return {
      symbol,
      name: p.companyName || q.name || symbol,
      sector: p.sector || 'Unknown',
      industry: p.industry || 'Unknown',
      marketCap: q.marketCap,
      qmScore,
      roic5y,
      operatingMargin,
      valueGap,
      growthSignals,
      sharesChange5y,
      debtToFcf,
      hiddenGemTier,
      confidenceScore: Math.round(confidenceScore),
      recommendation,
      scannedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    if (error.message === 'RATE_LIMIT') {
      throw error; // Re-throw to handle at batch level
    }
    return null;
  }
}

async function scanBatch(symbols: string[], batchNum: number, totalBatches: number): Promise<ScanResult[]> {
  console.log(`Batch ${batchNum}/${totalBatches}: ${symbols.join(', ')}`);

  const results: ScanResult[] = [];

  for (const symbol of symbols) {
    try {
      const result = await analyzeStock(symbol);
      if (result) {
        results.push(result);
        if (result.hiddenGemTier) {
          console.log(`  ✓ ${symbol}: ${result.hiddenGemTier.toUpperCase()} (score: ${result.confidenceScore})`);
        }
      }
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT') {
        console.log('  Rate limit hit, waiting 60 seconds...');
        await new Promise(r => setTimeout(r, 60000));
        // Retry this symbol
        try {
          const result = await analyzeStock(symbol);
          if (result) results.push(result);
        } catch {
          // Skip on second failure
        }
      }
    }

    // Small delay between stocks
    await new Promise(r => setTimeout(r, 200));
  }

  return results;
}

async function main() {
  console.log('='.repeat(70));
  console.log('FULL MARKET SCANNER - Hidden Gem Catalog Builder');
  console.log('='.repeat(70));

  if (!FMP_API_KEY) {
    console.error('Error: FMP_API_KEY environment variable required');
    process.exit(1);
  }

  // Load existing catalog if exists (for incremental updates)
  const catalogPath = path.join(__dirname, '..', 'data', 'hidden-gem-catalog.json');
  let existingCatalog: CatalogData | null = null;

  try {
    if (fs.existsSync(catalogPath)) {
      existingCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      console.log(`Loaded existing catalog with ${existingCatalog?.totalScanned || 0} stocks`);
    }
  } catch {
    // Start fresh
  }

  // Get all US stocks
  const allStocks = await getUSStocks();

  // Filter already scanned stocks (if incremental mode)
  const scannedSymbols = new Set(existingCatalog?.allResults.map(r => r.symbol) || []);
  const toScan = allStocks.filter(s => !scannedSymbols.has(s.symbol));

  console.log(`Stocks to scan: ${toScan.length}`);

  // Scan in batches
  const BATCH_SIZE = 5;
  const allResults: ScanResult[] = existingCatalog?.allResults || [];

  for (let i = 0; i < Math.min(toScan.length, 500); i += BATCH_SIZE) { // Limit to 500 for now
    const batch = toScan.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(Math.min(toScan.length, 500) / BATCH_SIZE);

    const batchResults = await scanBatch(batch.map(s => s.symbol), batchNum, totalBatches);
    allResults.push(...batchResults);

    // Rate limit between batches
    await new Promise(r => setTimeout(r, 1500));

    // Save progress every 10 batches
    if (batchNum % 10 === 0) {
      saveCatalog(allResults, catalogPath);
      console.log(`Progress saved: ${allResults.length} stocks`);
    }
  }

  // Final save
  saveCatalog(allResults, catalogPath);

  // Print summary
  printSummary(allResults);
}

function saveCatalog(results: ScanResult[], catalogPath: string) {
  const hiddenGems = results.filter(r => r.hiddenGemTier);

  // Sort by confidence score
  hiddenGems.sort((a, b) => b.confidenceScore - a.confidenceScore);

  const catalog: CatalogData = {
    lastUpdated: new Date().toISOString(),
    totalScanned: results.length,
    hiddenGemsCount: hiddenGems.length,
    crownJewels: hiddenGems.filter(r => r.hiddenGemTier === 'crown-jewel'),
    diamonds: hiddenGems.filter(r => r.hiddenGemTier === 'diamond'),
    golds: hiddenGems.filter(r => r.hiddenGemTier === 'gold'),
    silvers: hiddenGems.filter(r => r.hiddenGemTier === 'silver'),
    allResults: results,
  };

  // Ensure data directory exists
  const dir = path.dirname(catalogPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
}

function printSummary(results: ScanResult[]) {
  const hiddenGems = results.filter(r => r.hiddenGemTier);
  hiddenGems.sort((a, b) => b.confidenceScore - a.confidenceScore);

  console.log('\n' + '='.repeat(70));
  console.log('SCAN COMPLETE - SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total stocks scanned: ${results.length}`);
  console.log(`Hidden Gems found: ${hiddenGems.length}`);
  console.log(`  Crown Jewels: ${hiddenGems.filter(r => r.hiddenGemTier === 'crown-jewel').length}`);
  console.log(`  Diamonds: ${hiddenGems.filter(r => r.hiddenGemTier === 'diamond').length}`);
  console.log(`  Golds: ${hiddenGems.filter(r => r.hiddenGemTier === 'gold').length}`);
  console.log(`  Silvers: ${hiddenGems.filter(r => r.hiddenGemTier === 'silver').length}`);

  if (hiddenGems.length > 0) {
    console.log('\n--- TOP 10 HIDDEN GEMS ---');
    console.log('Rank  Symbol  Tier          Score  QM   ValueGap  Sector');
    console.log('-'.repeat(70));

    for (let i = 0; i < Math.min(10, hiddenGems.length); i++) {
      const g = hiddenGems[i];
      const tierIcon = g.hiddenGemTier === 'crown-jewel' ? '👑' :
                       g.hiddenGemTier === 'diamond' ? '💎' :
                       g.hiddenGemTier === 'gold' ? '🥇' : '🥈';
      console.log(
        `${(i + 1).toString().padEnd(6)}` +
        `${g.symbol.padEnd(8)}` +
        `${(tierIcon + ' ' + g.hiddenGemTier).padEnd(14)}` +
        `${g.confidenceScore.toString().padEnd(7)}` +
        `${(g.qmScore + '/8').padEnd(5)}` +
        `${((g.valueGap?.toFixed(0) || 'N/A') + '%').padEnd(10)}` +
        `${g.sector.substring(0, 20)}`
      );
    }
  }

  // Sector breakdown
  console.log('\n--- HIDDEN GEMS BY SECTOR ---');
  const bySector = new Map<string, ScanResult[]>();
  for (const g of hiddenGems) {
    const list = bySector.get(g.sector) || [];
    list.push(g);
    bySector.set(g.sector, list);
  }

  for (const [sector, gems] of Array.from(bySector.entries()).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`${sector}: ${gems.length} gems (${gems.map(g => g.symbol).join(', ')})`);
  }
}

main().catch(console.error);
