import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';

async function resetDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

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

  await client.end();

  console.log('✅ Database reset and migrated successfully!');
}

resetDatabase().catch((error) => {
  console.error('❌ Database reset failed:', error);
  process.exit(1);
});
