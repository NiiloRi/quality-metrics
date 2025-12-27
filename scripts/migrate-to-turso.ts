/**
 * Migrate local SQLite database to Turso
 *
 * Usage: npx tsx scripts/migrate-to-turso.ts
 */

import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import * as path from 'path';

const TURSO_URL = process.env.TURSO_DATABASE_URL!;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ TURSO_DATABASE_URL and TURSO_AUTH_TOKEN required');
  process.exit(1);
}

async function migrate() {
  console.log('======================================================================');
  console.log('MIGRATE TO TURSO');
  console.log('======================================================================\n');

  // Open local SQLite
  const localDbPath = path.join(process.cwd(), 'data', 'stocks.db');
  console.log(`📂 Local database: ${localDbPath}`);
  const localDb = new Database(localDbPath, { readonly: true });

  // Connect to Turso
  console.log(`☁️  Turso URL: ${TURSO_URL}\n`);
  const turso = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  });

  // Create tables
  console.log('Creating tables...');

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

  console.log('✓ Tables created\n');

  // Migrate users
  console.log('Migrating users...');
  try {
    const users = localDb.prepare('SELECT * FROM users').all() as any[];
    console.log(`  Found ${users.length} users`);

    for (const user of users) {
      await turso.execute({
        sql: `INSERT OR REPLACE INTO users (id, email, name, image, subscription_tier, trial_ends_at, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [user.id, user.email, user.name, user.image, user.subscription_tier, user.trial_ends_at, user.created_at]
      });
    }
    console.log(`✓ Migrated ${users.length} users\n`);
  } catch (e) {
    console.log('  No users table or empty\n');
  }

  // Migrate crown_jewels
  console.log('Migrating crown_jewels...');
  try {
    const jewels = localDb.prepare('SELECT * FROM crown_jewels').all() as any[];
    console.log(`  Found ${jewels.length} crown jewels`);

    let migrated = 0;
    for (const j of jewels) {
      try {
        await turso.execute({
          sql: `INSERT OR REPLACE INTO crown_jewels (
            symbol, name, sector, industry, market_cap_b, price, qm_score,
            pe5y_passes, roic5y_passes, shares_decreasing_passes, fcf_growing_passes,
            income_growing_passes, revenue_growing_passes, debt_low_passes, pfcf5y_passes,
            current_pe, pe5y, pfcf5y, fair_pe, value_gap_percent,
            roic5y_percent, operating_margin_percent, gross_margin_percent, roe_percent,
            revenue_growth_5y_percent, income_growth_5y_percent, fcf_growth_5y_percent,
            shares_change_5y_percent, debt_to_fcf_ratio, fcf_yield_percent,
            tier, confidence_score, growth_signals, scanned_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            j.symbol, j.name, j.sector, j.industry, j.market_cap_b, j.price, j.qm_score,
            j.pe5y_passes, j.roic5y_passes, j.shares_decreasing_passes, j.fcf_growing_passes,
            j.income_growing_passes, j.revenue_growing_passes, j.debt_low_passes, j.pfcf5y_passes,
            j.current_pe, j.pe5y, j.pfcf5y, j.fair_pe, j.value_gap_percent,
            j.roic5y_percent, j.operating_margin_percent, j.gross_margin_percent, j.roe_percent,
            j.revenue_growth_5y_percent, j.income_growth_5y_percent, j.fcf_growth_5y_percent,
            j.shares_change_5y_percent, j.debt_to_fcf_ratio, j.fcf_yield_percent,
            j.tier, j.confidence_score, j.growth_signals, j.scanned_at
          ]
        });
        migrated++;
      } catch (e) {
        console.error(`  Error migrating ${j.symbol}:`, e);
      }

      if (migrated % 100 === 0) {
        process.stdout.write(`\r  Migrated ${migrated}/${jewels.length}...`);
      }
    }
    console.log(`\n✓ Migrated ${migrated} crown jewels\n`);
  } catch (e) {
    console.log('  No crown_jewels table or error:', e);
  }

  // Migrate stocks
  console.log('Migrating stocks...');
  try {
    const stocks = localDb.prepare('SELECT * FROM stocks').all() as any[];
    console.log(`  Found ${stocks.length} stocks`);

    let migrated = 0;
    for (const s of stocks) {
      try {
        await turso.execute({
          sql: `INSERT OR REPLACE INTO stocks (
            symbol, name, sector, industry, market, data_source, market_cap, price,
            pe_ratio, qm_score, fair_pe, value_gap, valuation_status, rating,
            rating_score, is_hidden_gem, data_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            s.symbol, s.name, s.sector, s.industry, s.market, s.data_source,
            s.market_cap, s.price, s.pe_ratio, s.qm_score, s.fair_pe, s.value_gap,
            s.valuation_status, s.rating, s.rating_score, s.is_hidden_gem,
            s.data_json, s.updated_at
          ]
        });
        migrated++;
      } catch (e) {
        console.error(`  Error migrating stock ${s.symbol}:`, e);
      }

      if (migrated % 100 === 0) {
        process.stdout.write(`\r  Migrated ${migrated}/${stocks.length}...`);
      }
    }
    console.log(`\n✓ Migrated ${migrated} stocks\n`);
  } catch (e) {
    console.log('  No stocks table or error:', e);
  }

  // Verify migration
  console.log('Verifying migration...');
  const userCount = await turso.execute('SELECT COUNT(*) as count FROM users');
  const jewelCount = await turso.execute('SELECT COUNT(*) as count FROM crown_jewels');
  const stockCount = await turso.execute('SELECT COUNT(*) as count FROM stocks');

  console.log(`  Users: ${(userCount.rows[0] as any).count}`);
  console.log(`  Crown Jewels: ${(jewelCount.rows[0] as any).count}`);
  console.log(`  Stocks: ${(stockCount.rows[0] as any).count}`);

  console.log('\n======================================================================');
  console.log('MIGRATION COMPLETE');
  console.log('======================================================================');

  localDb.close();
}

migrate().catch(console.error);
