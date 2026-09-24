import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { DbService } from '../db/db.service';
import { courses, enrollments, resources, users } from '../db/schema';

import { CourseDto } from './dto/course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { ListCourseStudentsQueryDto } from './dto/list-course-students-query.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { PaginatedCourseStudentsDto } from './dto/paginated-course-students.dto';
import { PaginatedCoursesDto } from './dto/paginated-courses.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly dbService: DbService) {}

  async listCourses(
    query: ListCoursesQueryDto,
    authenticatedUserId: string,
  ): Promise<PaginatedCoursesDto> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');
    if (limit > 100) {
      throw new BadRequestException('limit must be at most 100');
    }
    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new BadRequestException('page is too large');
    }

    const sort = this.parseString(query.sort, 'sort') ?? 'alphabetical';
    if (!['alphabetical', 'newest', 'oldest'].includes(sort)) {
      throw new BadRequestException(
        'sort must be alphabetical, newest, or oldest',
      );
    }

    const search = this.parseString(query.search, 'search')?.trim();
    const code = this.parseString(query.code, 'code')?.trim();
    const filter = this.parseString(query.filter, 'filter');
    if (filter !== undefined && filter !== 'my-courses') {
      throw new BadRequestException('filter must be my-courses');
    }

    const studentCount = sql<number>`(
      select count(*)::int
      from ${enrollments}
      where ${enrollments.courseId} = ${courses.id}
    )`;

    const filters = and(
      search
        ? or(
            ilike(courses.name, `%${search}%`),
            ilike(courses.code, `%${search}%`),
            ilike(courses.description, `%${search}%`),
          )
        : undefined,
      code ? ilike(courses.code, `${code}%`) : undefined,
      filter === 'my-courses'
        ? sql`exists (
            select 1
            from ${enrollments}
            where ${enrollments.courseId} = ${courses.id}
              and ${enrollments.userId} = ${authenticatedUserId}
          )`
        : undefined,
    );

    const orderBy =
      sort === 'alphabetical'
        ? [asc(courses.name), asc(courses.code), asc(courses.id)]
        : sort === 'oldest'
          ? [asc(courses.createdAt), asc(courses.id)]
          : [desc(courses.createdAt), asc(courses.id)];

    const courseCodes = await this.dbService.db
      .selectDistinct({
        code: courses.code,
      })
      .from(courses);

    const codes = [
      ...new Set(
        courseCodes
          .map(({ code }) => code.match(/^[^0-9]+/)?.[0]?.trim())
          .filter((code): code is string => Boolean(code)),
      ),
    ].sort();

    const [data, totalRows] = await Promise.all([
      this.dbService.db
        .select({
          id: courses.id,
          code: courses.code,
          name: courses.name,
          description: courses.description,
          studentCount,
          createdAt: courses.createdAt,
          updatedAt: courses.updatedAt,
        })
        .from(courses)
        .where(filters)
        .orderBy(...orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.dbService.db.select({ total: count() }).from(courses).where(filters),
    ]);

    return { data, codes, page, limit, total: totalRows[0].total };
  }

  async getCourse(courseId: string): Promise<CourseDto> {
    const studentCount = sql<number>`(
      select count(*)::int
      from ${enrollments}
      where ${enrollments.courseId} = ${courses.id}
    )`;

    const [course] = await this.dbService.db
      .select({
        id: courses.id,
        code: courses.code,
        name: courses.name,
        description: courses.description,
        studentCount,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async listCourseStudents(
    courseId: string,
    query: ListCourseStudentsQueryDto,
  ): Promise<PaginatedCourseStudentsDto> {
    await this.requireCourse(courseId);

    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');
    if (limit > 100) {
      throw new BadRequestException('limit must be at most 100');
    }
    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new BadRequestException('page is too large');
    }

    const sort = this.parseString(query.sort, 'sort') ?? 'alphabetical';
    if (!['alphabetical', 'newest', 'oldest'].includes(sort)) {
      throw new BadRequestException(
        'sort must be alphabetical, newest, or oldest',
      );
    }

    const search = this.parseString(query.search, 'search')?.trim();
    const name = sql<string>`concat_ws(' ', ${users.firstName}, ${users.middleName}, ${users.lastName})`;

    const filters = and(
      eq(enrollments.courseId, courseId),
      search
        ? or(ilike(name, `%${search}%`), ilike(users.email, `%${search}%`))
        : undefined,
    );

    const orderBy =
      sort === 'newest'
        ? [desc(enrollments.joinedAt), asc(users.id)]
        : sort === 'oldest'
          ? [asc(enrollments.joinedAt), asc(users.id)]
          : [asc(users.firstName), asc(users.lastName), asc(users.id)];

    const [data, totalRows] = await Promise.all([
      this.dbService.db
        .select({
          id: users.id,
          firstName: users.firstName,
          middleName: users.middleName,
          lastName: users.lastName,
          email: users.email,
          profilePhotoUrl: users.profilePhotoUrl,
          enrolledAt: enrollments.joinedAt,
        })
        .from(enrollments)
        .innerJoin(users, eq(users.id, enrollments.userId))
        .where(filters)
        .orderBy(...orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.dbService.db
        .select({ total: count() })
        .from(enrollments)
        .innerJoin(users, eq(users.id, enrollments.userId))
        .where(filters),
    ]);

    return { data, page, limit, total: totalRows[0].total };
  }

  async createCourse(body: CreateCourseDto): Promise<CourseDto> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }

    const code = this.validateText(body.code, 'code', 50);
    const name = this.validateText(body.name, 'name', 255);
    const description =
      'description' in body
        ? this.validateText(body.description, 'description', 10_000, true)
        : null;

    await this.assertCodeAvailable(code);

    const now = new Date();
    const [course] = await this.dbService.db
      .insert(courses)
      .values({
        code,
        name,
        description,
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: courses.id,
        code: courses.code,
        name: courses.name,
        description: courses.description,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      });

    return { ...course, studentCount: 0 };
  }

  async updateCourse(
    courseId: string,
    body: UpdateCourseDto,
  ): Promise<CourseDto> {
    await this.requireCourse(courseId);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }

    const allowed = ['code', 'name', 'description'];
    const keys = Object.keys(body);
    if (keys.length === 0) {
      throw new BadRequestException('Supply at least one course field');
    }
    if (keys.some((key) => !allowed.includes(key))) {
      throw new BadRequestException('Supply only supported course fields');
    }

    const update: {
      code?: string;
      name?: string;
      description?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if ('code' in body) {
      update.code = this.validateText(body.code, 'code', 50);
      await this.assertCodeAvailable(update.code, courseId);
    }

    if ('name' in body) {
      update.name = this.validateText(body.name, 'name', 255);
    }

    if ('description' in body) {
      update.description = this.validateText(
        body.description,
        'description',
        10_000,
        true,
      );
    }

    const [course] = await this.dbService.db
      .update(courses)
      .set(update)
      .where(eq(courses.id, courseId))
      .returning({
        id: courses.id,
        code: courses.code,
        name: courses.name,
        description: courses.description,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.getCourse(course.id);
  }

  async deleteCourse(courseId: string): Promise<{ message: string }> {
    await this.requireCourse(courseId);

    const [resource] = await this.dbService.db
      .select({ id: resources.id })
      .from(resources)
      .where(eq(resources.courseId, courseId))
      .limit(1);

    if (resource) {
      throw new BadRequestException(
        'Cannot delete a course that still has resources',
      );
    }

    await this.dbService.db.transaction(async (tx) => {
      await tx.delete(enrollments).where(eq(enrollments.courseId, courseId));
      await tx.delete(courses).where(eq(courses.id, courseId));
    });

    return { message: 'Course deleted successfully' };
  }

  async enrollSelf(
    courseId: string,
    authenticatedUserId: string,
  ): Promise<EnrollmentDto> {
    return this.enrollUser(courseId, authenticatedUserId);
  }

  async enrollStudent(
    courseId: string,
    userId: string,
  ): Promise<EnrollmentDto> {
    return this.enrollUser(courseId, userId);
  }

  async unenrollSelf(
    courseId: string,
    authenticatedUserId: string,
  ): Promise<{ message: string }> {
    return this.unenrollUser(
      courseId,
      authenticatedUserId,
      'You are not enrolled in this course',
    );
  }

  async unenrollStudent(
    courseId: string,
    userId: string,
  ): Promise<{ message: string }> {
    return this.unenrollUser(
      courseId,
      userId,
      'Student is not enrolled in this course',
    );
  }

  private async enrollUser(
    courseId: string,
    userId: string,
  ): Promise<EnrollmentDto> {
    await this.requireCourse(courseId);

    const [user] = await this.dbService.db
      .select({
        id: users.id,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'student') {
      throw new BadRequestException('Only students can be enrolled');
    }

    if (user.status !== 'active') {
      throw new BadRequestException('Only active students can be enrolled');
    }

    const [existing] = await this.dbService.db
      .select({
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        joinedAt: enrollments.joinedAt,
      })
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('User is already enrolled in this course');
    }

    const [enrollment] = await this.dbService.db
      .insert(enrollments)
      .values({
        userId,
        courseId,
        joinedAt: new Date(),
      })
      .returning({
        userId: enrollments.userId,
        courseId: enrollments.courseId,
        joinedAt: enrollments.joinedAt,
      });

    return enrollment;
  }

  private async unenrollUser(
    courseId: string,
    userId: string,
    notEnrolledMessage: string,
  ): Promise<{ message: string }> {
    await this.requireCourse(courseId);

    const [existing] = await this.dbService.db
      .select({ userId: enrollments.userId })
      .from(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException(notEnrolledMessage);
    }

    await this.dbService.db
      .delete(enrollments)
      .where(
        and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)),
      );

    return { message: 'Successfully unenrolled from the course' };
  }

  private async requireCourse(courseId: string): Promise<void> {
    const [course] = await this.dbService.db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      throw new NotFoundException('Course not found');
    }
  }

  private async assertCodeAvailable(
    code: string,
    excludeCourseId?: string,
  ): Promise<void> {
    const [existing] = await this.dbService.db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.code, code))
      .limit(1);

    if (existing && existing.id !== excludeCourseId) {
      throw new ConflictException('Course code already exists');
    }
  }

  private parsePositiveInteger(
    value: unknown,
    fallback: number,
    name: string,
  ): number {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      throw new BadRequestException(`${name} must be a positive integer`);
    }
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 1) {
      throw new BadRequestException(`${name} must be a positive integer`);
    }
    return parsed;
  }

  private parseString(value: unknown, name: string): string | undefined {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') {
      throw new BadRequestException(`${name} must be a string`);
    }
    return value;
  }

  private validateText(
    value: unknown,
    name: string,
    maxLength: number,
    nullable: true,
  ): string | null;
  private validateText(value: unknown, name: string, maxLength: number): string;
  private validateText(
    value: unknown,
    name: string,
    maxLength: number,
    nullable = false,
  ): string | null {
    if (nullable && (value === null || value === undefined || value === '')) {
      return null;
    }
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > maxLength
    ) {
      throw new BadRequestException(
        `${name} must be a nonempty string of at most ${maxLength} characters${nullable ? ' or null' : ''}`,
      );
    }
    return value.trim();
  }
}
