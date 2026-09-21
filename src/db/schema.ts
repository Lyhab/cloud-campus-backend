import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  primaryKey,
  unique,
} from 'drizzle-orm/pg-core';

// Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),

  firstName: varchar('first_name', { length: 100 }).notNull(),

  middleName: varchar('middle_name', { length: 100 }),

  lastName: varchar('last_name', { length: 100 }).notNull(),

  email: varchar('email', { length: 255 }).notNull().unique(),

  passwordHash: varchar('password_hash', { length: 255 }).notNull(),

  role: varchar('role', {
    length: 20,
    enum: ['admin', 'student'],
  }).notNull(),

  status: varchar('status', {
    length: 20,
    enum: ['pending', 'active', 'inactive'],
  }).notNull(),

  profilePhotoUrl: varchar('profile_photo_url', { length: 500 }),

  joinedAt: timestamp('joined_at').notNull(),

  updatedAt: timestamp('updated_at').notNull(),
});

// Courses
export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),

  code: varchar('code', { length: 50 }).notNull().unique(),

  name: varchar('name', { length: 255 }).notNull(),

  description: text('description'),

  createdAt: timestamp('created_at').notNull(),

  updatedAt: timestamp('updated_at').notNull(),
});

// Enrollments
export const enrollments = pgTable(
  'enrollments',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id),

    joinedAt: timestamp('joined_at').notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.courseId],
    }),
  }),
);

// Resources
export const resources = pgTable('resources', {
  id: uuid('id').defaultRandom().primaryKey(),

  title: varchar('title', { length: 255 }).notNull(),

  description: text('description'),

  fileUrl: varchar('file_url', { length: 500 }).notNull(),

  fileType: varchar('file_type', { length: 50 }).notNull(),

  fileSizeMb: decimal('file_size_mb', {
    precision: 4,
    scale: 2,
  }),

  downloads: integer('downloads').notNull().default(0),

  status: varchar('status', { length: 20 }).notNull(),

  avgRating: decimal('avg_rating', {
    precision: 3,
    scale: 2,
  })
    .notNull()
    .default('0'),

  ratingCount: integer('rating_count').notNull().default(0),

  uploadedById: uuid('uploaded_by_id')
    .notNull()
    .references(() => users.id),

  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id),

  uploadedAt: timestamp('uploaded_at').notNull(),

  updatedAt: timestamp('updated_at').notNull(),
});

// Bookmarks
export const bookmarks = pgTable(
  'bookmarks',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id),

    createdAt: timestamp('created_at').notNull(),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.userId, table.resourceId],
    }),
  }),
);

// Ratings
export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    value: integer('value').notNull(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),

    resourceId: uuid('resource_id')
      .notNull()
      .references(() => resources.id),

    createdAt: timestamp('created_at').notNull(),

    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => ({
    userResourceUnique: unique().on(table.userId, table.resourceId),
  }),
);

// Reports
export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),

  resourceId: uuid('resource_id')
    .notNull()
    .references(() => resources.id),

  reporterId: uuid('reporter_id')
    .notNull()
    .references(() => users.id),

  reason: text('reason').notNull(),

  status: varchar('status', { length: 20 }).notNull(),

  createdAt: timestamp('created_at').notNull(),

  updatedAt: timestamp('updated_at').notNull(),
});
