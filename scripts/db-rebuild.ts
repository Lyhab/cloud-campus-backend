import 'dotenv/config';

import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

import { seed } from '../src/seeds/seed';

async function rebuildDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('🗑️ Dropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');
    await client.query('CREATE SCHEMA public;');

    console.log('📦 Running migrations...');

    const migrationDir = './drizzle';

    const migrationFiles = readdirSync(migrationDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📦 Running migration: ${file}`);

      const migration = readFileSync(join(migrationDir, file), 'utf8');

      const statements = migration
        .split('--> statement-breakpoint')
        .map((statement) => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await client.query(statement);
      }
    }

    console.log('🌱 Seeding database...');
    await seed();

    console.log('✅ Database rebuilt successfully!');
  } finally {
    await client.end();
  }
}

rebuildDatabase().catch((error: unknown) => {
  console.error('❌ Database rebuild failed:', error);
  process.exit(1);
});
