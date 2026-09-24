import { seedCourses } from './courses.seed';
import { seedUsers } from './users.seed';

export async function seed() {
  console.log('🌱 Starting database seeding...');

  await seedUsers();
  await seedCourses();

  console.log('✅ Database seeding completed.');
}
