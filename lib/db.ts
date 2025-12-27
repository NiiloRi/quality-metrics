import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'stocks.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
try {
  mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
} catch {}

const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    sector TEXT,
    industry TEXT,
    market TEXT DEFAULT 'US',
    data_source TEXT DEFAULT 'FMP',
    market_cap REAL,
    price REAL,
    pe_ratio REAL,
    qm_score INTEGER,
    fair_pe REAL,
    value_gap REAL,
    valuation_status TEXT,
    data_json TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_qm_score ON stocks(qm_score DESC);
  CREATE INDEX IF NOT EXISTS idx_value_gap ON stocks(value_gap DESC);
  CREATE INDEX IF NOT EXISTS idx_sector ON stocks(sector);
  CREATE INDEX IF NOT EXISTS idx_market ON stocks(market);
  CREATE INDEX IF NOT EXISTS idx_updated_at ON stocks(updated_at);
`);

// Migration: add market column if it doesn't exist
try {
  db.exec(`ALTER TABLE stocks ADD COLUMN market TEXT DEFAULT 'US'`);
} catch {
  // Column already exists
}

// Migration: add data_source column if it doesn't exist
try {
  db.exec(`ALTER TABLE stocks ADD COLUMN data_source TEXT DEFAULT 'FMP'`);
} catch {
  // Column already exists
}

// Migration: add rating columns if they don't exist
try {
  db.exec(`ALTER TABLE stocks ADD COLUMN rating TEXT`);
} catch {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE stocks ADD COLUMN rating_score INTEGER`);
} catch {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE stocks ADD COLUMN is_hidden_gem INTEGER DEFAULT 0`);
} catch {
  // Column already exists
}

export type Market = 'US' | 'Europe';

export type DataSource = 'FMP' | 'Yahoo';

export type Rating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell';

export interface StockRow {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  market: Market;
  data_source: DataSource;
  market_cap: number;
  price: number;
  pe_ratio: number | null;
  qm_score: number;
  fair_pe: number;
  value_gap: number | null;
  valuation_status: string;
  rating: Rating | null;
  rating_score: number | null;
  is_hidden_gem: number;
  data_json: string;
  updated_at: string;
}

export function upsertStock(stock: Omit<StockRow, 'updated_at'>) {
  const stmt = db.prepare(`
    INSERT INTO stocks (symbol, name, sector, industry, market, data_source, market_cap, price, pe_ratio, qm_score, fair_pe, value_gap, valuation_status, rating, rating_score, is_hidden_gem, data_json, updated_at)
    VALUES (@symbol, @name, @sector, @industry, @market, @data_source, @market_cap, @price, @pe_ratio, @qm_score, @fair_pe, @value_gap, @valuation_status, @rating, @rating_score, @is_hidden_gem, @data_json, datetime('now'))
    ON CONFLICT(symbol) DO UPDATE SET
      name = @name,
      sector = @sector,
      industry = @industry,
      market = @market,
      data_source = @data_source,
      market_cap = @market_cap,
      price = @price,
      pe_ratio = @pe_ratio,
      qm_score = @qm_score,
      fair_pe = @fair_pe,
      value_gap = @value_gap,
      valuation_status = @valuation_status,
      rating = @rating,
      rating_score = @rating_score,
      is_hidden_gem = @is_hidden_gem,
      data_json = @data_json,
      updated_at = datetime('now')
  `);

  stmt.run(stock);
}

export function getAllStocks(): StockRow[] {
  return db.prepare('SELECT * FROM stocks ORDER BY qm_score DESC, value_gap DESC').all() as StockRow[];
}

export function getStockBySymbol(symbol: string): StockRow | undefined {
  return db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol) as StockRow | undefined;
}

export function getTopStocks(limit = 50): StockRow[] {
  return db.prepare(`
    SELECT * FROM stocks
    WHERE qm_score >= 5
    ORDER BY value_gap DESC
    LIMIT ?
  `).all(limit) as StockRow[];
}

export function getStocksBySector(sector: string): StockRow[] {
  return db.prepare(`
    SELECT * FROM stocks
    WHERE sector = ?
    ORDER BY qm_score DESC, value_gap DESC
  `).all(sector) as StockRow[];
}

export function getStockCount(): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM stocks').get() as { count: number };
  return result.count;
}

export function getLastUpdateTime(): string | null {
  const result = db.prepare('SELECT MAX(updated_at) as last_update FROM stocks').get() as { last_update: string | null };
  return result.last_update;
}

export function getSectors(): string[] {
  const result = db.prepare('SELECT DISTINCT sector FROM stocks WHERE sector IS NOT NULL ORDER BY sector').all() as { sector: string }[];
  return result.map(r => r.sector);
}

export function getMarkets(): Market[] {
  const result = db.prepare('SELECT DISTINCT market FROM stocks WHERE market IS NOT NULL ORDER BY market').all() as { market: Market }[];
  return result.map(r => r.market);
}

export function getStockCountByMarket(market: Market): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM stocks WHERE market = ?').get(market) as { count: number };
  return result.count;
}

export function getLastUpdateTimeByMarket(market: Market): string | null {
  const result = db.prepare('SELECT MAX(updated_at) as last_update FROM stocks WHERE market = ?').get(market) as { last_update: string | null };
  return result.last_update;
}

// Users table for authentication
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    subscription_tier TEXT DEFAULT 'free',
    trial_ends_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`);

// Export function to get db instance (for use in other modules)
export function getDb() {
  return db;
}

export default db;
