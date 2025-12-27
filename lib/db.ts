/**
 * Database access layer
 *
 * Uses Turso (libSQL) for cloud deployment
 */

import { createClient, Client } from '@libsql/client';

// Create database client - uses Turso in production, local file in development
let dbClient: Client | null = null;

function getClient(): Client {
  if (!dbClient) {
    dbClient = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:./data/stocks.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return dbClient;
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

// Async database functions
export async function upsertStock(stock: Omit<StockRow, 'updated_at'>) {
  const db = getClient();
  await db.execute({
    sql: `INSERT INTO stocks (symbol, name, sector, industry, market, data_source, market_cap, price, pe_ratio, qm_score, fair_pe, value_gap, valuation_status, rating, rating_score, is_hidden_gem, data_json, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          ON CONFLICT(symbol) DO UPDATE SET
            name = excluded.name,
            sector = excluded.sector,
            industry = excluded.industry,
            market = excluded.market,
            data_source = excluded.data_source,
            market_cap = excluded.market_cap,
            price = excluded.price,
            pe_ratio = excluded.pe_ratio,
            qm_score = excluded.qm_score,
            fair_pe = excluded.fair_pe,
            value_gap = excluded.value_gap,
            valuation_status = excluded.valuation_status,
            rating = excluded.rating,
            rating_score = excluded.rating_score,
            is_hidden_gem = excluded.is_hidden_gem,
            data_json = excluded.data_json,
            updated_at = datetime('now')`,
    args: [
      stock.symbol, stock.name, stock.sector, stock.industry, stock.market,
      stock.data_source, stock.market_cap, stock.price, stock.pe_ratio,
      stock.qm_score, stock.fair_pe, stock.value_gap, stock.valuation_status,
      stock.rating, stock.rating_score, stock.is_hidden_gem, stock.data_json
    ]
  });
}

export async function getAllStocks(): Promise<StockRow[]> {
  const db = getClient();
  const result = await db.execute('SELECT * FROM stocks ORDER BY qm_score DESC, value_gap DESC');
  return result.rows as unknown as StockRow[];
}

export async function getStockBySymbol(symbol: string): Promise<StockRow | undefined> {
  const db = getClient();
  const result = await db.execute({ sql: 'SELECT * FROM stocks WHERE symbol = ?', args: [symbol] });
  return result.rows[0] as unknown as StockRow | undefined;
}

export async function getTopStocks(limit = 50): Promise<StockRow[]> {
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT * FROM stocks WHERE qm_score >= 5 ORDER BY value_gap DESC LIMIT ?',
    args: [limit]
  });
  return result.rows as unknown as StockRow[];
}

export async function getStocksBySector(sector: string): Promise<StockRow[]> {
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT * FROM stocks WHERE sector = ? ORDER BY qm_score DESC, value_gap DESC',
    args: [sector]
  });
  return result.rows as unknown as StockRow[];
}

export async function getStockCount(): Promise<number> {
  const db = getClient();
  const result = await db.execute('SELECT COUNT(*) as count FROM stocks');
  return (result.rows[0] as any)?.count || 0;
}

export async function getLastUpdateTime(): Promise<string | null> {
  const db = getClient();
  const result = await db.execute('SELECT MAX(updated_at) as last_update FROM stocks');
  return (result.rows[0] as any)?.last_update || null;
}

export async function getSectors(): Promise<string[]> {
  const db = getClient();
  const result = await db.execute('SELECT DISTINCT sector FROM stocks WHERE sector IS NOT NULL ORDER BY sector');
  return (result.rows as any[]).map(r => r.sector);
}

export async function getMarkets(): Promise<Market[]> {
  const db = getClient();
  const result = await db.execute('SELECT DISTINCT market FROM stocks WHERE market IS NOT NULL ORDER BY market');
  return (result.rows as any[]).map(r => r.market);
}

export async function getStockCountByMarket(market: Market): Promise<number> {
  const db = getClient();
  const result = await db.execute({ sql: 'SELECT COUNT(*) as count FROM stocks WHERE market = ?', args: [market] });
  return (result.rows[0] as any)?.count || 0;
}

export async function getLastUpdateTimeByMarket(market: Market): Promise<string | null> {
  const db = getClient();
  const result = await db.execute({ sql: 'SELECT MAX(updated_at) as last_update FROM stocks WHERE market = ?', args: [market] });
  return (result.rows[0] as any)?.last_update || null;
}

// User functions for auth
export async function getUserByEmail(email: string) {
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT * FROM users WHERE email = ?',
    args: [email]
  });
  return result.rows[0] as unknown as { id: string; email: string; subscription_tier: string; trial_ends_at: string | null } | undefined;
}

export async function createUser(user: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  subscriptionTier: string;
  trialEndsAt: string;
}) {
  const db = getClient();
  await db.execute({
    sql: `INSERT INTO users (id, email, name, image, subscription_tier, trial_ends_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [user.id, user.email, user.name, user.image, user.subscriptionTier, user.trialEndsAt]
  });
}

export async function updateUserSubscription(userId: string, tier: string) {
  const db = getClient();
  await db.execute({
    sql: 'UPDATE users SET subscription_tier = ? WHERE id = ?',
    args: [tier, userId]
  });
}

export async function getUserById(id: string) {
  const db = getClient();
  const result = await db.execute({
    sql: 'SELECT id, subscription_tier, trial_ends_at FROM users WHERE id = ?',
    args: [id]
  });
  return result.rows[0] as unknown as { id: string; subscription_tier: string; trial_ends_at: string | null } | undefined;
}

// Export getDb for backward compatibility (returns client)
export function getDb() {
  return getClient();
}

export default getClient();
