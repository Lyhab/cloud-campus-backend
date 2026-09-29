import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { bookmarks, courses, ratings, resources, users } from '../db/schema';

type SeedResource = {
  title: string;
  description: string | null;
  courseCode: string;
  uploader: string;
  fileType: string;
  fileSizeMb: string;
  downloads: number;
  status: 'pending' | 'approved' | 'rejected';
  ratings: { email: string; value: number }[];
  bookmarks: string[];
};

const seedResourcesData: SeedResource[] = [
  {
    title: 'REST API Cheat Sheet',
    description: 'Common REST patterns and status codes.',
    courseCode: 'INFS803',
    uploader: 'benjamin.jackson@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '0.90',
    downloads: 445,
    status: 'approved',
    ratings: [
      { email: 'emily.taylor@cloudcampus.test', value: 5 },
      { email: 'isabella.white@cloudcampus.test', value: 5 },
      { email: 'lucas.harris@cloudcampus.test', value: 4 },
    ],
    bookmarks: ['emily.taylor@cloudcampus.test', 'mia.martin@cloudcampus.test'],
  },
  {
    title: 'Week 4 Cloud Architecture',
    description: 'Slides on scalable cloud architecture patterns.',
    courseCode: 'INFS803',
    uploader: 'mia.martin@cloudcampus.test',
    fileType: 'pptx',
    fileSizeMb: '8.10',
    downloads: 198,
    status: 'approved',
    ratings: [{ email: 'ethan.thompson@cloudcampus.test', value: 4 }],
    bookmarks: [],
  },
  {
    title: 'Machine Learning Revision Notes',
    description: 'Summary of supervised and unsupervised methods.',
    courseCode: 'COMP809',
    uploader: 'charlotte.garcia@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '3.20',
    downloads: 260,
    status: 'approved',
    ratings: [
      { email: 'emily.taylor@cloudcampus.test', value: 5 },
      { email: 'william.miller@cloudcampus.test', value: 4 },
    ],
    bookmarks: ['william.miller@cloudcampus.test'],
  },
  {
    title: 'Data Mining Practice Dataset',
    description: 'Sample dataset for the clustering lab.',
    courseCode: 'COMP809',
    uploader: 'sophia.moore@cloudcampus.test',
    fileType: 'csv',
    fileSizeMb: '1.50',
    downloads: 75,
    status: 'approved',
    ratings: [{ email: 'jack.lewis@cloudcampus.test', value: 3 }],
    bookmarks: [],
  },
  {
    title: 'Network Security Lab Guide',
    description: 'Step-by-step guide for the packet analysis lab.',
    courseCode: 'COMP833',
    uploader: 'ethan.thompson@cloudcampus.test',
    fileType: 'docx',
    fileSizeMb: '1.10',
    downloads: 54,
    status: 'approved',
    ratings: [{ email: 'olivia.davis@cloudcampus.test', value: 4 }],
    bookmarks: ['olivia.davis@cloudcampus.test'],
  },
  {
    title: 'Cryptography Formula Sheet',
    description: 'Key algorithms and formulas for the exam.',
    courseCode: 'COMP830',
    uploader: 'isabella.white@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '0.60',
    downloads: 33,
    status: 'approved',
    ratings: [],
    bookmarks: [],
  },
  {
    title: 'Software Architecture Patterns',
    description: 'Overview of layered, microservice and event-driven styles.',
    courseCode: 'COMP806',
    uploader: 'jack.lewis@cloudcampus.test',
    fileType: 'pptx',
    fileSizeMb: '5.40',
    downloads: 0,
    status: 'pending',
    ratings: [],
    bookmarks: [],
  },
  {
    title: 'Outdated Lecture Recording Notes',
    description: 'Rejected: content does not match the course.',
    courseCode: 'COMP813',
    uploader: 'michael.brown@cloudcampus.test',
    fileType: 'docx',
    fileSizeMb: '0.40',
    downloads: 0,
    status: 'rejected',
    ratings: [],
    bookmarks: [],
  },
  {
    title: 'Deep Learning Lab 1 Notebook',
    description: 'CNN basics with worked examples.',
    courseCode: 'COMP838',
    uploader: 'emily.taylor@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '2.10',
    downloads: 140,
    status: 'approved',
    ratings: [
      { email: 'michael.brown@cloudcampus.test', value: 5 },
      { email: 'mia.martin@cloudcampus.test', value: 4 },
    ],
    bookmarks: ['mia.martin@cloudcampus.test'],
  },
  {
    title: 'Backpropagation Explained',
    description: 'Step-by-step derivation.',
    courseCode: 'COMP838',
    uploader: 'lucas.harris@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '1.30',
    downloads: 95,
    status: 'approved',
    ratings: [{ email: 'olivia.davis@cloudcampus.test', value: 5 }],
    bookmarks: [],
  },
  {
    title: 'Text Preprocessing Guide',
    description: 'Tokenisation, stemming and stop words.',
    courseCode: 'COMP814',
    uploader: 'olivia.davis@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '0.80',
    downloads: 61,
    status: 'approved',
    ratings: [{ email: 'ethan.thompson@cloudcampus.test', value: 4 }],
    bookmarks: ['ethan.thompson@cloudcampus.test'],
  },
  {
    title: 'Sentiment Analysis Dataset',
    description: 'Labelled reviews for practice.',
    courseCode: 'COMP814',
    uploader: 'ethan.thompson@cloudcampus.test',
    fileType: 'csv',
    fileSizeMb: '4.20',
    downloads: 88,
    status: 'approved',
    ratings: [{ email: 'sophia.moore@cloudcampus.test', value: 3 }],
    bookmarks: [],
  },
  {
    title: 'Image Filtering Slides',
    description: 'Convolution and edge detection.',
    courseCode: 'COMP820',
    uploader: 'charlotte.garcia@cloudcampus.test',
    fileType: 'pptx',
    fileSizeMb: '6.50',
    downloads: 47,
    status: 'approved',
    ratings: [{ email: 'jack.lewis@cloudcampus.test', value: 4 }],
    bookmarks: [],
  },
  {
    title: 'Information Security Exam Prep',
    description: 'Past paper questions and answers.',
    courseCode: 'COMP821',
    uploader: 'william.miller@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '1.90',
    downloads: 210,
    status: 'approved',
    ratings: [
      { email: 'emily.taylor@cloudcampus.test', value: 5 },
      { email: 'benjamin.jackson@cloudcampus.test', value: 5 },
    ],
    bookmarks: [
      'emily.taylor@cloudcampus.test',
      'benjamin.jackson@cloudcampus.test',
    ],
  },
  {
    title: 'Usability Heuristics Summary',
    description: "Nielsen's heuristics with examples.",
    courseCode: 'COMP822',
    uploader: 'mia.martin@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '0.70',
    downloads: 66,
    status: 'approved',
    ratings: [{ email: 'isabella.white@cloudcampus.test', value: 4 }],
    bookmarks: [],
  },
  {
    title: 'R Programming Cheat Sheet',
    description: 'Common data manipulation commands.',
    courseCode: 'COMP828',
    uploader: 'sophia.moore@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '0.50',
    downloads: 180,
    status: 'approved',
    ratings: [
      { email: 'michael.brown@cloudcampus.test', value: 5 },
      { email: 'lucas.harris@cloudcampus.test', value: 4 },
    ],
    bookmarks: ['lucas.harris@cloudcampus.test'],
  },
  {
    title: 'Cybercrime Case Studies',
    description: 'Recent incidents and analysis.',
    courseCode: 'COMP831',
    uploader: 'jack.lewis@cloudcampus.test',
    fileType: 'docx',
    fileSizeMb: '2.30',
    downloads: 39,
    status: 'approved',
    ratings: [],
    bookmarks: [],
  },
  {
    title: 'Formal Methods Notation Guide',
    description: 'Z notation basics.',
    courseCode: 'ENSE803',
    uploader: 'benjamin.jackson@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '1.20',
    downloads: 28,
    status: 'approved',
    ratings: [{ email: 'charlotte.garcia@cloudcampus.test', value: 3 }],
    bookmarks: [],
  },
  {
    title: 'AWS EC2 and VPC Notes',
    description: 'Networking and compute fundamentals.',
    courseCode: 'INFS803',
    uploader: 'olivia.davis@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '3.00',
    downloads: 275,
    status: 'approved',
    ratings: [
      { email: 'emily.taylor@cloudcampus.test', value: 5 },
      { email: 'ethan.thompson@cloudcampus.test', value: 5 },
      { email: 'sophia.moore@cloudcampus.test', value: 4 },
    ],
    bookmarks: [
      'emily.taylor@cloudcampus.test',
      'sophia.moore@cloudcampus.test',
    ],
  },
  {
    title: 'Serverless Architecture Slides',
    description: 'Lambda, API Gateway and DynamoDB.',
    courseCode: 'INFS803',
    uploader: 'william.miller@cloudcampus.test',
    fileType: 'pptx',
    fileSizeMb: '7.20',
    downloads: 152,
    status: 'approved',
    ratings: [{ email: 'mia.martin@cloudcampus.test', value: 4 }],
    bookmarks: [],
  },
  {
    title: 'Big Data Pipeline Diagram',
    description: 'ETL flow for the assignment.',
    courseCode: 'COMP810',
    uploader: 'emily.taylor@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '1.60',
    downloads: 58,
    status: 'approved',
    ratings: [{ email: 'jack.lewis@cloudcampus.test', value: 4 }],
    bookmarks: ['jack.lewis@cloudcampus.test'],
  },
  {
    title: 'Search Algorithms Summary',
    description: 'A*, BFS, DFS and heuristics.',
    courseCode: 'COMP813',
    uploader: 'lucas.harris@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '1.00',
    downloads: 132,
    status: 'approved',
    ratings: [
      { email: 'olivia.davis@cloudcampus.test', value: 5 },
      { email: 'william.miller@cloudcampus.test', value: 4 },
    ],
    bookmarks: [],
  },
  {
    title: 'IoT Sensor Data Sample',
    description: 'Sample readings for the lab.',
    courseCode: 'COMP816',
    uploader: 'ethan.thompson@cloudcampus.test',
    fileType: 'csv',
    fileSizeMb: '2.80',
    downloads: 22,
    status: 'approved',
    ratings: [],
    bookmarks: [],
  },
  {
    title: 'Genetic Algorithm Notes',
    description: 'Selection, crossover and mutation.',
    courseCode: 'COMP815',
    uploader: 'charlotte.garcia@cloudcampus.test',
    fileType: 'pdf',
    fileSizeMb: '1.40',
    downloads: 49,
    status: 'approved',
    ratings: [{ email: 'benjamin.jackson@cloudcampus.test', value: 4 }],
    bookmarks: [],
  },
  {
    title: 'Android App Starter Project',
    description: 'Template for the mobile assignment.',
    courseCode: 'COMP826',
    uploader: 'jack.lewis@cloudcampus.test',
    fileType: 'zip',
    fileSizeMb: '12.50',
    downloads: 84,
    status: 'approved',
    ratings: [{ email: 'isabella.white@cloudcampus.test', value: 5 }],
    bookmarks: ['isabella.white@cloudcampus.test'],
  },
  {
    title: 'Blockchain Consensus Slides',
    description: 'PoW, PoS and PBFT compared.',
    courseCode: 'COMP842',
    uploader: 'mia.martin@cloudcampus.test',
    fileType: 'pptx',
    fileSizeMb: '4.90',
    downloads: 0,
    status: 'pending',
    ratings: [],
    bookmarks: [],
  },
  {
    title: 'Agile Sprint Planning Template',
    description: 'Backlog and sprint board template.',
    courseCode: 'ENSE880',
    uploader: 'sophia.moore@cloudcampus.test',
    fileType: 'xlsx',
    fileSizeMb: '0.30',
    downloads: 0,
    status: 'pending',
    ratings: [],
    bookmarks: [],
  },
];

export async function seedResources() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    console.log('🌱📄📄 Seeding resources...');
    const db = drizzle(client);

    const courseId = new Map(
      (
        await db.select({ id: courses.id, code: courses.code }).from(courses)
      ).map((c) => [c.code, c.id]),
    );
    const userId = new Map(
      (await db.select({ id: users.id, email: users.email }).from(users)).map(
        (u) => [u.email, u.id],
      ),
    );

    const get = (map: Map<string, string>, key: string) => {
      const value = map.get(key);
      if (!value) throw new Error(`Seed lookup failed: ${key}`);
      return value;
    };

    const now = new Date();
    const ratingRows: (typeof ratings.$inferInsert)[] = [];
    const bookmarkRows: (typeof bookmarks.$inferInsert)[] = [];

    const resourceRows = seedResourcesData.map((r) => {
      const id = randomUUID();
      const count = r.ratings.length;
      const avg = count
        ? (r.ratings.reduce((sum, x) => sum + x.value, 0) / count).toFixed(2)
        : '0.00';

      r.ratings.forEach((x) =>
        ratingRows.push({
          userId: get(userId, x.email),
          resourceId: id,
          value: x.value,
          createdAt: now,
          updatedAt: now,
        }),
      );
      r.bookmarks.forEach((email) =>
        bookmarkRows.push({
          userId: get(userId, email),
          resourceId: id,
          createdAt: now,
        }),
      );

      return {
        id,
        title: r.title,
        description: r.description,
        fileUrl: `resources/seed/${id}.${r.fileType}`,
        fileType: r.fileType,
        fileSizeMb: r.fileSizeMb,
        downloads: r.downloads,
        status: r.status,
        avgRating: avg,
        ratingCount: count,
        uploadedById: get(userId, r.uploader),
        courseId: get(courseId, r.courseCode),
        uploadedAt: now,
        updatedAt: now,
      };
    });

    await db.insert(resources).values(resourceRows);
    if (ratingRows.length) await db.insert(ratings).values(ratingRows);
    if (bookmarkRows.length) await db.insert(bookmarks).values(bookmarkRows);
  } finally {
    await client.end();
  }
}
