import { seedCourses } from './courses.seed';
import { seedUsers } from './users.seed';
import { seedResources } from './resources.seed';
import { seedReports } from './reports.seed';

export async function seed() {
  console.log('🌱 Starting database seeding...');

  await seedUsers();
  await seedCourses();
  await seedResources();
  await seedReports();

  console.log('✅ Database seeding completed.');
}
