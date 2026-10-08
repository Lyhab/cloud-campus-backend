import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { reports, resources, users } from '../db/schema';

type SeedReport = {
  resourceTitle: string;
  reporter: string;
  reason: string;
  status: 'pending' | 'dismissed' | 'resolved';
};

const seedReportsData: SeedReport[] = [
  {
    resourceTitle: 'REST API Cheat Sheet',
    reporter: 'mia.martin@cloudcampus.test',
    reason: 'Some of the HTTP status code explanations appear to be incorrect.',
    status: 'pending',
  },
  {
    resourceTitle: 'Week 4 Cloud Architecture',
    reporter: 'emily.taylor@cloudcampus.test',
    reason: 'The slides contain outdated information about cloud architecture.',
    status: 'pending',
  },
  {
    resourceTitle: 'Machine Learning Revision Notes',
    reporter: 'jack.lewis@cloudcampus.test',
    reason:
      'The resource appears to contain misleading information about machine learning algorithms.',
    status: 'resolved',
  },
  {
    resourceTitle: 'Data Mining Practice Dataset',
    reporter: 'olivia.davis@cloudcampus.test',
    reason:
      'The dataset may contain personal information that should not be shared.',
    status: 'pending',
  },
  {
    resourceTitle: 'Network Security Lab Guide',
    reporter: 'sophia.moore@cloudcampus.test',
    reason: 'The file is missing some important steps and may be incomplete.',
    status: 'dismissed',
  },
  {
    resourceTitle: 'Outdated Lecture Recording Notes',
    reporter: 'emily.taylor@cloudcampus.test',
    reason:
      'This resource does not match the course content and contains outdated material.',
    status: 'resolved',
  },
  {
    resourceTitle: 'Software Architecture Patterns',
    reporter: 'william.miller@cloudcampus.test',
    reason: 'The uploaded document appears to be unrelated to the course.',
    status: 'pending',
  },
  {
    resourceTitle: 'Blockchain Consensus Slides',
    reporter: 'charlotte.garcia@cloudcampus.test',
    reason:
      'The slides contain duplicated content and inaccurate explanations.',
    status: 'pending',
  },
  {
    resourceTitle: 'Text Preprocessing Guide',
    reporter: 'benjamin.jackson@cloudcampus.test',
    reason:
      'The resource may have been uploaded without permission from its original author.',
    status: 'pending',
  },
  {
    resourceTitle: 'Android App Starter Project',
    reporter: 'mia.martin@cloudcampus.test',
    reason:
      'The downloadable file does not appear to match the resource description.',
    status: 'dismissed',
  },
  {
    resourceTitle: 'AWS EC2 and VPC Notes',
    reporter: 'lucas.harris@cloudcampus.test',
    reason:
      'The VPC subnet and routing explanations seem outdated compared to the current AWS documentation.',
    status: 'pending',
  },
  {
    resourceTitle: 'Search Algorithms Summary',
    reporter: 'sophia.moore@cloudcampus.test',
    reason:
      'The heuristic examples for A* are unclear and the complexity notes look incorrect.',
    status: 'pending',
  },
];

export async function seedReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('🌱🚩🚩 Seeding reports...');
    const db = drizzle(client);

    const resourceId = new Map(
      (
        await db
          .select({
            id: resources.id,
            title: resources.title,
          })
          .from(resources)
      ).map((resource) => [resource.title, resource.id]),
    );

    const userId = new Map(
      (
        await db
          .select({
            id: users.id,
            email: users.email,
          })
          .from(users)
      ).map((user) => [user.email, user.id]),
    );

    const get = (map: Map<string, string>, key: string) => {
      const value = map.get(key);
      if (!value) {
        throw new Error(`Seed lookup failed: ${key}`);
      }
      return value;
    };

    const now = new Date();

    const reportRows: (typeof reports.$inferInsert)[] = seedReportsData.map(
      (report, index) => {
        const createdAt = new Date(now.getTime() - index * 24 * 60 * 60 * 1000);

        return {
          id: randomUUID(),
          resourceId: get(resourceId, report.resourceTitle),
          reporterId: get(userId, report.reporter),
          reason: report.reason,
          status: report.status,
          createdAt,
          updatedAt: createdAt,
        };
      },
    );

    await db.insert(reports).values(reportRows);
  } finally {
    await client.end();
  }
}
