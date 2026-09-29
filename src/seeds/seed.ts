import { seedCourses } from './courses.seed';
import { seedUsers } from './users.seed';
import { seedResources } from './resources.seed';

export async function seed() {
  console.log('🌱 Starting database seeding...');

  await seedUsers();
  await seedCourses();
  await seedResources();

  console.log('✅ Database seeding completed.');
}
