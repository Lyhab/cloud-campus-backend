import { Injectable } from '@nestjs/common';
import { count, eq, sql } from 'drizzle-orm';

import { DbService } from '../db/db.service';
import { users, courses, resources } from '../db/schema';

@Injectable()
export class HomepageService {
  constructor(private readonly dbService: DbService) {}

  async getHomepageStats() {
    const [
      [totalStudents],
      [totalCourses],
      [totalResources],
      [totalDownloads],
    ] = await Promise.all([
      this.dbService.db
        .select({ value: count() })
        .from(users)
        .where(eq(users.role, 'student')),

      this.dbService.db.select({ value: count() }).from(courses),

      this.dbService.db
        .select({ value: count() })
        .from(resources)
        .where(eq(resources.status, 'approved')),

      this.dbService.db
        .select({
          value: sql<number>`coalesce(sum(${resources.downloads}), 0)::int`,
        })
        .from(resources)
        .where(eq(resources.status, 'approved')),
    ]);

    return {
      totalStudents: totalStudents.value,
      totalCourses: totalCourses.value,
      totalResources: totalResources.value,
      totalDownloads: totalDownloads.value,
    };
  }
}
