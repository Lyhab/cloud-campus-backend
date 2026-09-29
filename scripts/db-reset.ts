import 'dotenv/config';

import { Client } from 'pg';

async function resetDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('🗑️ Dropping public schema...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE;');

    console.log('📦 Recreating public schema...');
    await client.query('CREATE SCHEMA public;');

    console.log('✅ Database reset successfully!');
  } finally {
    await client.end();
  }
}

resetDatabase().catch((error: unknown) => {
  console.error('❌ Database reset failed:', error);
  process.exit(1);
});
