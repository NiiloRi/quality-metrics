/**
 * Seed demo users with credentials
 *
 * Run: npx tsx scripts/seed-users.ts
 */

import bcrypt from 'bcryptjs';
import { createClient } from '@libsql/client';
import { randomUUID } from 'crypto';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:./data/stocks.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

interface DemoUser {
  username: string;
  password: string;
  email: string;
  role: 'user' | 'admin';
  tier: 'premium' | 'free';
}

const DEMO_USERS: DemoUser[] = [
  { username: 'teijo', password: 'Teijo2025!', email: 'teijo@demo.qm', role: 'user', tier: 'premium' },
  { username: 'aleksi', password: 'Aleksi2025!', email: 'aleksi@demo.qm', role: 'user', tier: 'premium' },
  { username: 'jari', password: 'Jari2025!', email: 'jari@demo.qm', role: 'user', tier: 'premium' },
  { username: 'olli', password: 'Olli2025!', email: 'olli@demo.qm', role: 'user', tier: 'premium' },
  { username: 'niilo', password: 'qm2025', email: 'niilo@qualitymetrics.fi', role: 'admin', tier: 'premium' },
];

async function seedUsers() {
  console.log('Seeding demo users...\n');

  for (const user of DEMO_USERS) {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(user.password, 10);

    try {
      // Check if user already exists
      const existing = await db.execute({
        sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
        args: [user.username, user.email]
      });

      if (existing.rows.length > 0) {
        // Update existing user
        await db.execute({
          sql: `UPDATE users SET
                password_hash = ?,
                subscription_tier = ?,
                role = ?
                WHERE username = ? OR email = ?`,
          args: [passwordHash, user.tier, user.role, user.username, user.email]
        });
        console.log(`Updated: ${user.username} (${user.role})`);
      } else {
        // Create new user
        await db.execute({
          sql: `INSERT INTO users (id, email, username, password_hash, subscription_tier, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          args: [id, user.email, user.username, passwordHash, user.tier, user.role]
        });
        console.log(`Created: ${user.username} (${user.role})`);
      }
    } catch (error) {
      console.error(`Error with ${user.username}:`, error);
    }
  }

  console.log('\n--- Demo Accounts ---');
  console.log('Username    | Password     | Role');
  console.log('------------|--------------|------');
  for (const user of DEMO_USERS) {
    console.log(`${user.username.padEnd(12)}| ${user.password.padEnd(13)}| ${user.role}`);
  }
  console.log('\nDone!');
}

seedUsers().catch(console.error);
