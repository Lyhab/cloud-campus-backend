import 'dotenv/config';
import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

import { users } from '../db/schema';

type SeedUser = {
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  role: 'admin' | 'student';
  status: 'pending' | 'active' | 'inactive';
  joinedAt: Date;
};

const seedUsersData: SeedUser[] = [
  // Admins
  {
    firstName: 'James',
    middleName: 'Robert',
    lastName: 'Anderson',
    email: 'james.anderson@cloudcampus.test',
    role: 'admin',
    status: 'active',
    joinedAt: new Date('2026-08-01T09:00:00Z'),
  },
  {
    firstName: 'Sarah',
    middleName: 'Jane',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@cloudcampus.test',
    role: 'admin',
    status: 'active',
    joinedAt: new Date('2026-08-05T09:00:00Z'),
  },
  {
    firstName: 'Daniel',
    middleName: null,
    lastName: 'Wilson',
    email: 'daniel.wilson@cloudcampus.test',
    role: 'admin',
    status: 'active',
    joinedAt: new Date('2026-08-10T09:00:00Z'),
  },

  // Students
  {
    firstName: 'Emily',
    middleName: 'Rose',
    lastName: 'Taylor',
    email: 'emily.taylor@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-12T09:00:00Z'),
  },
  {
    firstName: 'Michael',
    middleName: 'James',
    lastName: 'Brown',
    email: 'michael.brown@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-14T09:00:00Z'),
  },
  {
    firstName: 'Olivia',
    middleName: null,
    lastName: 'Davis',
    email: 'olivia.davis@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-16T09:00:00Z'),
  },
  {
    firstName: 'William',
    middleName: 'Henry',
    lastName: 'Miller',
    email: 'william.miller@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-18T09:00:00Z'),
  },
  {
    firstName: 'Sophia',
    middleName: 'Grace',
    lastName: 'Moore',
    email: 'sophia.moore@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-20T09:00:00Z'),
  },
  {
    firstName: 'Benjamin',
    middleName: null,
    lastName: 'Jackson',
    email: 'benjamin.jackson@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-22T09:00:00Z'),
  },
  {
    firstName: 'Isabella',
    middleName: 'Marie',
    lastName: 'White',
    email: 'isabella.white@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-24T09:00:00Z'),
  },
  {
    firstName: 'Lucas',
    middleName: 'Alexander',
    lastName: 'Harris',
    email: 'lucas.harris@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-26T09:00:00Z'),
  },
  {
    firstName: 'Mia',
    middleName: null,
    lastName: 'Martin',
    email: 'mia.martin@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-28T09:00:00Z'),
  },
  {
    firstName: 'Ethan',
    middleName: 'David',
    lastName: 'Thompson',
    email: 'ethan.thompson@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-08-30T09:00:00Z'),
  },
  {
    firstName: 'Charlotte',
    middleName: 'Anne',
    lastName: 'Garcia',
    email: 'charlotte.garcia@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-09-01T09:00:00Z'),
  },
  {
    firstName: 'Alexander',
    middleName: null,
    lastName: 'Martinez',
    email: 'alexander.martinez@cloudcampus.test',
    role: 'student',
    status: 'inactive',
    joinedAt: new Date('2026-09-03T09:00:00Z'),
  },
  {
    firstName: 'Amelia',
    middleName: 'Louise',
    lastName: 'Robinson',
    email: 'amelia.robinson@cloudcampus.test',
    role: 'student',
    status: 'inactive',
    joinedAt: new Date('2026-09-05T09:00:00Z'),
  },
  {
    firstName: 'Henry',
    middleName: 'Thomas',
    lastName: 'Clark',
    email: 'henry.clark@cloudcampus.test',
    role: 'student',
    status: 'pending',
    joinedAt: new Date('2026-09-07T09:00:00Z'),
  },
  {
    firstName: 'Jack',
    middleName: 'Edward',
    lastName: 'Lewis',
    email: 'jack.lewis@cloudcampus.test',
    role: 'student',
    status: 'active',
    joinedAt: new Date('2026-09-09T09:00:00Z'),
  },
];

export async function seedUsers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('🌱👨👩 Seeding users...');

    const db = drizzle(client);

    const values = seedUsersData.map((user) => ({
      id: randomUUID(),
      ...user,
      passwordHash: 'SEEDED',
      profilePhotoUrl: null,
      updatedAt: user.joinedAt,
    }));

    await db.insert(users).values(values);

    console.log(`✅ Seeded ${values.length} users.`);
  } finally {
    await client.end();
  }
}
