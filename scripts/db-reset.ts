import 'dotenv/config';
import { readFileSync } from 'fs';
import { Client } from 'pg';

import { seedUsers } from '../src/seeds/users.seed';

async function resetDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('🗑️ Dropping public schema...');

    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');

    console.log('📦 Running migration...');

    const migration = readFileSync('./drizzle/0000_soft_drax.sql', 'utf8');

    const statements = migration
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean);

    for (const statement of statements) {
      await client.query(statement);
    }

    console.log('🌱 Seeding users...');

    await seedUsers();

    console.log('✅ Database reset, migrated, and seeded successfully!');
  } finally {
    await client.end();
  }
}

resetDatabase().catch((error: unknown) => {
  console.error('❌ Database reset failed:', error);
  process.exit(1);
});
