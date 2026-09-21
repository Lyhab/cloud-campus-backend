import { seedUsers } from './users.seed';

async function seed() {
  console.log('🌱 Starting database seeding...');

  await seedUsers();

  console.log('✅ Database seeding completed.');
}

seed().catch((error) => {
  console.error('❌ Database seeding failed:', error);
  process.exit(1);
});
