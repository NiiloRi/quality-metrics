import { createClient, type InValue } from '@libsql/client';

// Create Turso client - works both locally and in production
const turso = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/stocks.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export default turso;

// Initialize database schema
export async function initializeDatabase() {
  // Stocks table
  await turso.execute(`
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
      rating TEXT,
      rating_score INTEGER,
      is_hidden_gem INTEGER DEFAULT 0,
      data_json TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Users table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      image TEXT,
      subscription_tier TEXT DEFAULT 'free',
      trial_ends_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crown jewels table
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS crown_jewels (
      symbol TEXT PRIMARY KEY,
      name TEXT,
      sector TEXT,
      industry TEXT,
      market_cap_b REAL,
      price REAL,
      qm_score INTEGER,
      pe5y_passes INTEGER,
      roic5y_passes INTEGER,
      shares_decreasing_passes INTEGER,
      fcf_growing_passes INTEGER,
      income_growing_passes INTEGER,
      revenue_growing_passes INTEGER,
      debt_low_passes INTEGER,
      pfcf5y_passes INTEGER,
      current_pe REAL,
      pe5y REAL,
      pfcf5y REAL,
      fair_pe REAL,
      value_gap_percent REAL,
      roic5y_percent REAL,
      operating_margin_percent REAL,
      gross_margin_percent REAL,
      roe_percent REAL,
      revenue_growth_5y_percent REAL,
      income_growth_5y_percent REAL,
      fcf_growth_5y_percent REAL,
      shares_change_5y_percent REAL,
      debt_to_fcf_ratio REAL,
      fcf_yield_percent REAL,
      tier TEXT,
      confidence_score REAL,
      growth_signals INTEGER,
      scanned_at TEXT
    )
  `);

  // Create indexes
  await turso.execute('CREATE INDEX IF NOT EXISTS idx_stocks_qm_score ON stocks(qm_score DESC)');
  await turso.execute('CREATE INDEX IF NOT EXISTS idx_stocks_sector ON stocks(sector)');
  await turso.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  await turso.execute('CREATE INDEX IF NOT EXISTS idx_crown_jewels_tier ON crown_jewels(tier)');
}

// Helper to run queries
export async function query<T = unknown>(sql: string, args: InValue[] = []): Promise<T[]> {
  const result = await turso.execute({ sql, args });
  return result.rows as T[];
}

// Helper to run a single query that returns one row
export async function queryOne<T = unknown>(sql: string, args: InValue[] = []): Promise<T | null> {
  const result = await turso.execute({ sql, args });
  return (result.rows[0] as T) || null;
}

// Helper to execute statements (INSERT, UPDATE, DELETE)
export async function execute(sql: string, args: InValue[] = []) {
  return turso.execute({ sql, args });
}
