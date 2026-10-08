import { ForbiddenException, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, sql } from 'drizzle-orm';
import { DbService } from '../db/db.service';
import {
  bookmarks,
  courses,
  enrollments,
  reports,
  resources,
  users,
} from '../db/schema';
import { UploadStatsQueryDto } from './dto/upload-stats-query.dto';
import { RecentResourcesQueryDto } from './dto/recent-resources-query.dto';
import { NewUsersQueryDto } from './dto/new-users-query.dto';
import { PendingReportsQueryDto } from './dto/pending-reports-query.dto';
import { DashboardResourcesQueryDto } from './dto/dashboard-resources-query.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DbService) {}

  private parseLimit(
    value: string | number | undefined,
    defaultValue: number,
    max = 100,
  ) {
    const parsed = Number(value ?? defaultValue);

    if (!Number.isInteger(parsed) || parsed < 1) {
      return defaultValue;
    }

    return Math.min(parsed, max);
  }

  private async getUserRole(userId: string) {
    const [user] = await this.db.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    return user.role;
  }

  async getStats(userId: string) {
    const role = await this.getUserRole(userId);

    if (role === 'admin') {
      const [[totalUsers], [totalCourses], [totalResources], [pendingReports]] =
        await Promise.all([
          this.db.db.select({ value: count() }).from(users),
          this.db.db.select({ value: count() }).from(courses),
          this.db.db.select({ value: count() }).from(resources),
          this.db.db
            .select({ value: count() })
            .from(reports)
            .where(eq(reports.status, 'pending')),
        ]);

      return {
        totalUsers: totalUsers.value,
        totalCourses: totalCourses.value,
        totalResources: totalResources.value,
        pendingReports: pendingReports.value,
      };
    }

    const [[myCourses], [myUploads], [bookmarked], [totalResources]] =
      await Promise.all([
        this.db.db
          .select({ value: count() })
          .from(enrollments)
          .where(eq(enrollments.userId, userId)),
        this.db.db
          .select({ value: count() })
          .from(resources)
          .where(eq(resources.uploadedById, userId)),
        this.db.db
          .select({ value: count() })
          .from(bookmarks)
          .where(eq(bookmarks.userId, userId)),
        this.db.db
          .select({ value: count() })
          .from(resources)
          .where(eq(resources.status, 'approved')),
      ]);

    return {
      myCourses: myCourses.value,
      myUploads: myUploads.value,
      bookmarked: bookmarked.value,
      totalResources: totalResources.value,
    };
  }

  async getUploadStats(query: UploadStatsQueryDto) {
    const period = query.period ?? '6months';
    const months = Number(period.replace('months', '').replace('month', ''));

    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months + 1, 1),
    );

    const monthExpression = sql<string>`
      to_char(date_trunc('month', ${resources.uploadedAt}), 'YYYY-MM')
    `;

    const rows = await this.db.db
      .select({
        month: monthExpression,
        value: count(),
      })
      .from(resources)
      .where(gte(resources.uploadedAt, start))
      .groupBy(monthExpression);

    const counts = new Map(rows.map((row) => [row.month, row.value]));

    return Array.from({ length: months }, (_, index) => {
      const date = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + index, 1),
      );
      const key = `${date.getUTCFullYear()}-${String(
        date.getUTCMonth() + 1,
      ).padStart(2, '0')}`;

      return {
        label: date.toLocaleString('en-NZ', {
          month: 'short',
          timeZone: 'UTC',
        }),
        value: counts.get(key) ?? 0,
      };
    });
  }

  async getRecentResources(query: RecentResourcesQueryDto) {
    const limit = this.parseLimit(query.limit, 5);
    const sort = query.sort ?? 'newest';

    const orderBy =
      sort === 'oldest'
        ? asc(resources.uploadedAt)
        : desc(resources.uploadedAt);

    const rows = await this.db.db
      .select({
        id: resources.id,
        title: resources.title,
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
        fileType: resources.fileType,
        uploadedById: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        uploadedAt: resources.uploadedAt,
      })
      .from(resources)
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .innerJoin(users, eq(resources.uploadedById, users.id))
      .where(eq(resources.status, 'approved'))
      .orderBy(orderBy)
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      course: {
        id: row.courseId,
        code: row.courseCode,
        name: row.courseName,
      },
      fileType: row.fileType.toUpperCase(),
      uploadedBy: {
        id: row.uploadedById,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
      },
      uploadedAt: row.uploadedAt,
    }));
  }

  async getNewUsers(query: NewUsersQueryDto) {
    const limit = this.parseLimit(query.limit, 5);
    const sort = query.sort ?? 'newest';

    const orderBy =
      sort === 'oldest' ? asc(users.joinedAt) : desc(users.joinedAt);

    return this.db.db
      .select({
        id: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        email: users.email,
        joinedAt: users.joinedAt,
      })
      .from(users)
      .orderBy(orderBy)
      .limit(limit);
  }

  async getPendingReports(query: PendingReportsQueryDto, userId?: string) {
    if (!userId || (await this.getUserRole(userId)) !== 'admin') {
      throw new ForbiddenException(
        'Only administrators can view dashboard reports',
      );
    }

    const limit = this.parseLimit(query.limit, 5);
    const sort = query.sort ?? 'oldest';
    const status = query.status ?? 'pending';

    const orderBy =
      sort === 'newest' ? desc(reports.createdAt) : asc(reports.createdAt);

    const rows = await this.db.db
      .select({
        id: reports.id,
        resourceId: resources.id,
        resourceTitle: resources.title,
        reporterId: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        reason: reports.reason,
        date: reports.createdAt,
      })
      .from(reports)
      .innerJoin(resources, eq(reports.resourceId, resources.id))
      .innerJoin(users, eq(reports.reporterId, users.id))
      .where(eq(reports.status, status))
      .orderBy(orderBy)
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      resource: {
        id: row.resourceId,
        title: row.resourceTitle,
      },
      reporter: {
        id: row.reporterId,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
      },
      reason: row.reason,
      date: row.date,
    }));
  }

  async getMyCourses(userId: string) {
    const rows = await this.db.db
      .select({
        id: courses.id,
        code: courses.code,
        name: courses.name,
        description: courses.description,
        resourceCount: sql<number>`count(${resources.id})::int`,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .leftJoin(
        resources,
        and(
          eq(resources.courseId, courses.id),
          eq(resources.status, 'approved'),
        ),
      )
      .where(eq(enrollments.userId, userId))
      .groupBy(courses.id, courses.code, courses.name, courses.description)
      .limit(2);

    return rows;
  }

  async getResources(query: DashboardResourcesQueryDto) {
    const limit = this.parseLimit(query.limit, 3);
    const minRatingCount = this.parseLimit(query.minRatingCount, 5, 1000000);
    const sort = query.sort ?? 'rating';

    const orderBy =
      sort === 'downloads'
        ? desc(resources.downloads)
        : sort === 'newest'
          ? desc(resources.uploadedAt)
          : desc(resources.avgRating);

    const rows = await this.db.db
      .select({
        id: resources.id,
        title: resources.title,
        fileType: resources.fileType,
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
        uploadedById: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        downloads: resources.downloads,
        rating: resources.avgRating,
        ratingCount: resources.ratingCount,
      })
      .from(resources)
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .innerJoin(users, eq(resources.uploadedById, users.id))
      .where(
        and(
          eq(resources.status, 'approved'),
          gte(resources.ratingCount, minRatingCount),
        ),
      )
      .orderBy(orderBy)
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      fileType: row.fileType.toUpperCase(),
      course: {
        id: row.courseId,
        code: row.courseCode,
        name: row.courseName,
      },
      uploadedBy: {
        id: row.uploadedById,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
      },
      downloads: row.downloads,
      rating: Number(row.rating),
      ratingCount: row.ratingCount,
    }));
  }
}
