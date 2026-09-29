import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { DbService } from '../db/db.service';
import { S3Service } from '../s3/s3.service';
import { courses, reports, resources, users } from '../db/schema';

import { CreateReportDto } from './dto/create-report.dto';
import { ListReportsQueryDto } from './dto/list-reports-query.dto';
import { PaginatedReportsDto } from './dto/paginated-reports.dto';
import { ReportDto } from './dto/report.dto';
import { UpdateReportStatusDto } from './dto/update-report-status.dto';

const reporter = alias(users, 'reporter');
const uploader = alias(users, 'uploader');

const reportColumns = {
  id: reports.id,
  reason: reports.reason,
  status: reports.status,
  createdAt: reports.createdAt,
  updatedAt: reports.updatedAt,

  reporterId: reporter.id,
  reporterFirstName: reporter.firstName,
  reporterMiddleName: reporter.middleName,
  reporterLastName: reporter.lastName,
  reporterEmail: reporter.email,

  resourceId: resources.id,
  resourceTitle: resources.title,
  resourceDescription: resources.description,
  resourceFileUrl: resources.fileUrl,
  resourceFileType: resources.fileType,
  resourceFileSizeMb: resources.fileSizeMb,
  resourceDownloads: resources.downloads,
  resourceStatus: resources.status,
  resourceAvgRating: resources.avgRating,
  resourceRatingCount: resources.ratingCount,
  resourceUploadedAt: resources.uploadedAt,
  resourceUpdatedAt: resources.updatedAt,

  uploaderId: uploader.id,
  uploaderFirstName: uploader.firstName,
  uploaderMiddleName: uploader.middleName,
  uploaderLastName: uploader.lastName,
  uploaderEmail: uploader.email,
  uploaderProfilePhotoUrl: uploader.profilePhotoUrl,

  courseId: courses.id,
  courseCode: courses.code,
  courseName: courses.name,
};

type ReportRow = {
  id: string;
  reason: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  reporterId: string;
  reporterFirstName: string;
  reporterMiddleName: string | null;
  reporterLastName: string;
  reporterEmail: string;
  resourceId: string;
  resourceTitle: string;
  resourceDescription: string | null;
  resourceFileUrl: string;
  resourceFileType: string;
  resourceFileSizeMb: string | null;
  resourceDownloads: number;
  resourceStatus: string;
  resourceAvgRating: string;
  resourceRatingCount: number;
  resourceUploadedAt: Date;
  resourceUpdatedAt: Date;
  uploaderId: string;
  uploaderFirstName: string;
  uploaderMiddleName: string | null;
  uploaderLastName: string;
  uploaderEmail: string;
  uploaderProfilePhotoUrl: string | null;
  courseId: string;
  courseCode: string;
  courseName: string;
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly dbService: DbService,
    private readonly s3Service: S3Service,
  ) {}

  async listReports(query: ListReportsQueryDto): Promise<PaginatedReportsDto> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');

    if (limit > 100) {
      throw new BadRequestException('limit must be at most 100');
    }

    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new BadRequestException('page is too large');
    }

    const sort = this.parseString(query.sort, 'sort') ?? 'newest';

    if (!['newest', 'oldest'].includes(sort)) {
      throw new BadRequestException('sort must be newest or oldest');
    }

    const status = this.parseString(query.status, 'status') ?? 'all';

    if (!['all', 'pending', 'dismissed', 'resolved'].includes(status)) {
      throw new BadRequestException(
        'status must be all, pending, dismissed, or resolved',
      );
    }

    const search = this.parseString(query.search, 'search')?.trim();

    const reporterName = sql<string>`concat_ws(' ', ${reporter.firstName}, ${reporter.middleName}, ${reporter.lastName})`;

    const filters = and(
      status === 'all' ? undefined : eq(reports.status, status),
      search
        ? or(
            ilike(resources.title, `%${search}%`),
            ilike(reports.reason, `%${search}%`),
            ilike(reporterName, `%${search}%`),
            ilike(reporter.email, `%${search}%`),
          )
        : undefined,
    );

    const orderBy =
      sort === 'oldest'
        ? [asc(reports.createdAt), asc(reports.id)]
        : [desc(reports.createdAt), asc(reports.id)];

    const [rows, totalRows, pendingRows] = await Promise.all([
      this.dbService.db
        .select(reportColumns)
        .from(reports)
        .innerJoin(resources, eq(reports.resourceId, resources.id))
        .innerJoin(reporter, eq(reports.reporterId, reporter.id))
        .innerJoin(uploader, eq(resources.uploadedById, uploader.id))
        .innerJoin(courses, eq(resources.courseId, courses.id))
        .where(filters)
        .orderBy(...orderBy)
        .limit(limit)
        .offset((page - 1) * limit),

      this.dbService.db
        .select({ total: count() })
        .from(reports)
        .innerJoin(resources, eq(reports.resourceId, resources.id))
        .innerJoin(reporter, eq(reports.reporterId, reporter.id))
        .where(filters),

      // Independent of filters: used for the "N pending" header.
      this.dbService.db
        .select({ total: count() })
        .from(reports)
        .where(eq(reports.status, 'pending')),
    ]);

    const data = await Promise.all(rows.map((row) => this.toReportDto(row)));

    return {
      data,
      pendingCount: pendingRows[0].total,
      page,
      limit,
      total: totalRows[0].total,
    };
  }

  async getReport(reportId: string): Promise<ReportDto> {
    this.validateUuid(reportId, 'reportId');

    const [row] = await this.dbService.db
      .select(reportColumns)
      .from(reports)
      .innerJoin(resources, eq(reports.resourceId, resources.id))
      .innerJoin(reporter, eq(reports.reporterId, reporter.id))
      .innerJoin(uploader, eq(resources.uploadedById, uploader.id))
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Report not found');
    }

    return this.toReportDto(row);
  }

  async createReport(
    body: CreateReportDto,
    authenticatedUserId: string,
  ): Promise<ReportDto> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }

    const resourceId = body.resourceId;
    this.validateUuid(resourceId, 'resourceId');

    const reason = this.validateText(body.reason, 'reason', 1000);

    const [resource] = await this.dbService.db
      .select({ id: resources.id })
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const [existing] = await this.dbService.db
      .select({ id: reports.id })
      .from(reports)
      .where(
        and(
          eq(reports.resourceId, resourceId),
          eq(reports.reporterId, authenticatedUserId),
          eq(reports.status, 'pending'),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException(
        'You already have a pending report for this resource',
      );
    }

    const now = new Date();

    const [created] = await this.dbService.db
      .insert(reports)
      .values({
        resourceId,
        reporterId: authenticatedUserId,
        reason,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: reports.id });

    if (!created) {
      throw new Error('Report insert returned no row');
    }

    return this.getReport(created.id);
  }

  async updateReportStatus(
    reportId: string,
    body: UpdateReportStatusDto,
  ): Promise<ReportDto> {
    this.validateUuid(reportId, 'reportId');

    if (
      !body ||
      typeof body !== 'object' ||
      !['dismissed', 'resolved'].includes(body.status)
    ) {
      throw new BadRequestException('status must be dismissed or resolved');
    }

    const [updated] = await this.dbService.db
      .update(reports)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(reports.id, reportId))
      .returning({ id: reports.id });

    if (!updated) {
      throw new NotFoundException('Report not found');
    }

    return this.getReport(updated.id);
  }

  private async toReportDto(row: ReportRow): Promise<ReportDto> {
    return {
      id: row.id,
      reason: row.reason,
      status: row.status,
      resource: {
        id: row.resourceId,
        title: row.resourceTitle,
        description: row.resourceDescription,
        fileUrl: await this.s3Service.getPresignedUrl(row.resourceFileUrl),
        fileType: row.resourceFileType,
        fileSizeMb: row.resourceFileSizeMb,
        downloads: row.resourceDownloads,
        status: row.resourceStatus,
        avgRating: row.resourceAvgRating,
        ratingCount: row.resourceRatingCount,
        creator: {
          id: row.uploaderId,
          firstName: row.uploaderFirstName,
          middleName: row.uploaderMiddleName,
          lastName: row.uploaderLastName,
          email: row.uploaderEmail,
          profilePhotoUrl: row.uploaderProfilePhotoUrl
            ? await this.s3Service.getPresignedUrl(row.uploaderProfilePhotoUrl)
            : null,
        },
        course: {
          id: row.courseId,
          code: row.courseCode,
          name: row.courseName,
        },
        uploadedAt: row.resourceUploadedAt,
        updatedAt: row.resourceUpdatedAt,
      },
      reporter: {
        id: row.reporterId,
        firstName: row.reporterFirstName,
        middleName: row.reporterMiddleName,
        lastName: row.reporterLastName,
        email: row.reporterEmail,
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private validateText(
    value: unknown,
    name: string,
    maxLength: number,
  ): string {
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > maxLength
    ) {
      throw new BadRequestException(
        `${name} must be a nonempty string of at most ${maxLength} characters`,
      );
    }

    return value.trim();
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

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  private validateUuid(value: unknown, name: string): asserts value is string {
    if (typeof value !== 'string' || !this.isUuid(value)) {
      throw new BadRequestException(`${name} must be a valid UUID`);
    }
  }
}
