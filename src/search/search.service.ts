import { Injectable } from '@nestjs/common';
import { and, eq, ilike, or } from 'drizzle-orm';

import { DbService } from '../db/db.service';
import { courses, resources, reports, users } from '../db/schema';
import { SearchQueryDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private readonly dbService: DbService) {}

  async search(query: SearchQueryDto, userId: string) {
    const [user] = await this.dbService.db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return {
        resources: [],
        courses: [],
      };
    }

    const searchTerm = `%${query.q.trim()}%`;
    const limit = this.parseLimit(query.limit);

    const [resourceResults, courseResults] = await Promise.all([
      this.dbService.db
        .select({
          id: resources.id,
          title: resources.title,
          fileType: resources.fileType,
          course: {
            id: courses.id,
            code: courses.code,
            name: courses.name,
          },
        })
        .from(resources)
        .innerJoin(courses, eq(resources.courseId, courses.id))
        .where(
          and(
            user.role === 'admin'
              ? undefined
              : eq(resources.status, 'approved'),
            or(
              ilike(resources.title, searchTerm),
              ilike(resources.description, searchTerm),
            ),
          ),
        )
        .limit(limit),

      this.dbService.db
        .select({
          id: courses.id,
          code: courses.code,
          name: courses.name,
        })
        .from(courses)
        .where(
          or(
            ilike(courses.code, searchTerm),
            ilike(courses.name, searchTerm),
            ilike(courses.description, searchTerm),
          ),
        )
        .limit(limit),
    ]);

    const result = {
      resources: resourceResults,
      courses: courseResults,
    };

    if (user.role !== 'admin') {
      return result;
    }

    const [reportResults, userResults] = await Promise.all([
      this.dbService.db
        .select({
          id: reports.id,
          reason: reports.reason,
          status: reports.status,
          resource: {
            id: resources.id,
            title: resources.title,
          },
        })
        .from(reports)
        .innerJoin(resources, eq(reports.resourceId, resources.id))
        .where(
          or(
            ilike(reports.reason, searchTerm),
            ilike(resources.title, searchTerm),
          ),
        )
        .limit(limit),

      this.dbService.db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          status: users.status,
        })
        .from(users)
        .where(
          or(
            ilike(users.firstName, searchTerm),
            ilike(users.lastName, searchTerm),
            ilike(users.email, searchTerm),
          ),
        )
        .limit(limit),
    ]);

    return {
      ...result,
      reports: reportResults,
      users: userResults,
    };
  }

  private parseLimit(value?: string): number {
    const limit = Number(value ?? 10);

    if (!Number.isInteger(limit) || limit < 1) {
      return 10;
    }

    return Math.min(limit, 100);
  }
}
