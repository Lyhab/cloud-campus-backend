import 'dotenv/config';

import { randomUUID } from 'crypto';
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { inArray } from 'drizzle-orm';

import { courses, enrollments } from '../db/schema';

type SeedCourse = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const seedCoursesData: SeedCourse[] = [
  {
    id: randomUUID(),
    code: 'COMP809',
    name: 'Data Mining and Machine Learning',
    description:
      'Explores data mining techniques and machine learning methods for discovering patterns and making predictions from data.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP814',
    name: 'Text Mining',
    description:
      'Covers techniques for processing, analysing, and extracting useful information from large collections of text data.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP820',
    name: 'Video and Image Processing',
    description:
      'Introduces methods for analysing and processing digital images and video using computer vision techniques.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP821',
    name: 'Information Security',
    description:
      'Examines principles, technologies, and practices for protecting information systems and digital resources.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP822',
    name: 'Human and Computer Interaction',
    description:
      'Explores the design and evaluation of interactive systems with a focus on usability and user experience.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP828',
    name: 'Statistical Programming for Data Science',
    description:
      'Develops practical skills in statistical programming and computational methods for analysing data.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP831',
    name: 'Cybercrime and Cybersecurity',
    description:
      'Examines cybercrime, cybersecurity threats, and approaches for protecting systems and digital information.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP838',
    name: 'Deep Learning',
    description:
      'Covers deep neural networks and their applications to modern machine learning and artificial intelligence problems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'ENSE803',
    name: 'Formal Specification and Design',
    description:
      'Introduces formal methods for specifying, modelling, and designing reliable software systems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'INFS803',
    name: 'Cloud Computing',
    description:
      'Explores cloud computing concepts, architectures, services, and technologies for developing scalable applications.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP800',
    name: 'Neuroinformatics',
    description:
      'Explores computational approaches for analysing, modelling, and understanding information related to neuroscience.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP806',
    name: 'Software Architecture',
    description:
      'Examines principles and patterns for designing, evaluating, and evolving software system architectures.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP810',
    name: 'Data Warehousing and Big Data',
    description:
      'Covers data warehousing, big data technologies, and analytical approaches for managing large-scale datasets.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP813',
    name: 'Artificial Intelligence',
    description:
      'Introduces artificial intelligence concepts and techniques for solving complex computational problems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP816',
    name: 'Advanced Internet of Things and Applications',
    description:
      'Explores advanced Internet of Things technologies and their applications in connected and intelligent systems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP815',
    name: 'Nature Inspired Computing',
    description:
      'Examines computational techniques inspired by natural processes for solving optimisation and complex problems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP825',
    name: 'Special Topic B',
    description:
      'Provides an opportunity to explore a specialised and emerging topic in computing through advanced study.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP826',
    name: 'Mobile Systems Development',
    description:
      'Covers the design and development of software applications and services for modern mobile computing platforms.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP842',
    name: 'Applied Blockchains and Cryptocurrencies',
    description:
      'Explores blockchain technologies, cryptocurrencies, and their practical applications in computing systems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'INFS813',
    name: 'Information Technology Strategy and Policy',
    description:
      'Examines strategic and policy issues involved in managing information technology within organisations.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP833',
    name: 'Network Security and Forensics',
    description:
      'Covers network security principles and forensic techniques for investigating network-based security incidents.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'ENSE880',
    name: 'Agile Information Technology Project Management',
    description:
      'Explores agile approaches, practices, and principles for managing information technology projects.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'ENSE882',
    name: 'Team Facilitation for Information Technology Projects',
    description:
      'Develops skills for facilitating effective teamwork, collaboration, and communication in IT projects.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'ENSE883',
    name: 'Information Technology Project Portfolios in Organisations',
    description:
      'Examines approaches for managing and aligning information technology project portfolios with organisational objectives.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP830',
    name: 'Cryptography and Cryptanalysis',
    description:
      'Studies cryptographic techniques and methods for analysing and evaluating secure communication systems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'COMP832',
    name: 'Digital Forensics Tools and Techniques',
    description:
      'Introduces tools and techniques used to collect, examine, and analyse digital forensic evidence.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'ENGE811',
    name: 'Specialist Readings C - Robotic Vision',
    description:
      'Explores computer vision methods and technologies used for perception and visual understanding in robotic systems.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: randomUUID(),
    code: 'ENSE881',
    name: 'Digital Transformation and Change Management',
    description:
      'Examines digital transformation and approaches for managing organisational change driven by technology.',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];

const STUDENT_ID = '99be6468-e071-7070-6895-c7f07bf2aa65';

const ENROLLED_COURSE_CODES = [
  'COMP809',
  'COMP814',
  'COMP820',
  'COMP821',
  'COMP822',
  'COMP828',
  'COMP838',
  'INFS803',
  'COMP810',
  'COMP813',
  'COMP806',
  'COMP800',
  'COMP816',
  'COMP825',
  'COMP826',
  'COMP842',
];

export async function seedCourses() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  try {
    console.log('🌱📚 Seeding courses...');

    const db = drizzle(client);

    await db.insert(courses).values(seedCoursesData);

    const selectedCourses = await db
      .select({
        id: courses.id,
        code: courses.code,
      })
      .from(courses)
      .where(inArray(courses.code, ENROLLED_COURSE_CODES));

    if (selectedCourses.length !== ENROLLED_COURSE_CODES.length) {
      const foundCodes = new Set(selectedCourses.map((course) => course.code));

      const missingCourses = ENROLLED_COURSE_CODES.filter(
        (code) => !foundCodes.has(code),
      );

      throw new Error(`Missing courses: ${missingCourses.join(', ')}`);
    }

    const enrollmentValues = selectedCourses.map((course) => ({
      userId: STUDENT_ID,
      courseId: course.id,
      joinedAt: new Date('2026-02-16T00:00:00Z'),
    }));

    await db.insert(enrollments).values(enrollmentValues);
  } finally {
    await client.end();
  }
}
