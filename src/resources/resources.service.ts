import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { DbService } from '../db/db.service';
import { S3Service } from '../s3/s3.service';
import {
  bookmarks,
  courses,
  ratings,
  reports,
  resources,
  users,
} from '../db/schema';

import { CreateResourceDto } from './dto/create-resource.dto';
import { ListResourcesQueryDto } from './dto/list-resources-query.dto';
import { PaginatedResourcesDto } from './dto/paginated-resources.dto';
import { ResourceDto } from './dto/resource.dto';
import { ResourceBookmarkDto } from './dto/resource-bookmark.dto';
import { ResourceRatingDto } from './dto/resource-rating.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { UpdateResourceStatusDto } from './dto/update-resource-status.dto';

type UploadedResourceFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
};

@Injectable()
export class ResourcesService {
  constructor(
    private readonly dbService: DbService,
    private readonly s3Service: S3Service,
  ) {}

  async listResources(
    query: ListResourcesQueryDto,
    authenticatedUserId?: string,
  ): Promise<PaginatedResourcesDto> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');

    if (limit > 100) {
      throw new BadRequestException('limit must be at most 100');
    }

    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new BadRequestException('page is too large');
    }

    const sort = this.parseString(query.sort, 'sort') ?? 'newest';

    const allowedSorts = [
      'alphabetical',
      'newest',
      'most-downloaded',
      'top-rated',
    ];

    if (!allowedSorts.includes(sort)) {
      throw new BadRequestException(
        'sort must be alphabetical, newest, most-downloaded, or top-rated',
      );
    }

    const filter = this.parseString(query.filter, 'filter') ?? 'all';

    if (!['all', 'bookmarked', 'my-uploads'].includes(filter)) {
      throw new BadRequestException(
        'filter must be all, bookmarked, or my-uploads',
      );
    }

    if (
      (filter === 'bookmarked' || filter === 'my-uploads') &&
      !authenticatedUserId
    ) {
      throw new UnauthorizedException(
        'Authentication is required for this filter.',
      );
    }

    const status = this.parseString(query.status, 'status') ?? 'all';

    if (!['all', 'pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestException(
        'status must be all, pending, approved, or rejected',
      );
    }

    const search = this.parseString(query.search, 'search')?.trim();
    const courseId = this.parseString(query.courseId, 'courseId');
    const fileType = this.parseString(query.fileType, 'fileType')?.trim();

    if (courseId && !this.isUuid(courseId)) {
      throw new BadRequestException('courseId must be a valid UUID');
    }

    if (fileType !== undefined && !fileType) {
      throw new BadRequestException('fileType must not be empty');
    }

    const authenticatedUser = authenticatedUserId
      ? await this.dbService.db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, authenticatedUserId))
          .limit(1)
      : [];

    const isAdmin = authenticatedUser[0]?.role === 'admin';

    const requestedView = this.parseString(query.view, 'view') ?? 'student';

    if (!['admin', 'student'].includes(requestedView)) {
      throw new BadRequestException('view must be admin or student');
    }

    if (requestedView === 'admin' && !isAdmin) {
      throw new ForbiddenException('Only administrators can use admin view.');
    }

    const statusFilter =
      requestedView === 'admin'
        ? status === 'all'
          ? undefined
          : eq(resources.status, status)
        : eq(resources.status, 'approved');

    const filters = and(
      filter === 'my-uploads'
        ? eq(resources.uploadedById, authenticatedUserId!)
        : undefined,

      statusFilter,

      search
        ? or(
            ilike(resources.title, `%${search}%`),
            ilike(resources.description, `%${search}%`),
          )
        : undefined,

      courseId ? eq(resources.courseId, courseId) : undefined,

      fileType ? eq(resources.fileType, fileType) : undefined,

      filter === 'bookmarked'
        ? sql`exists (
          select 1
          from ${bookmarks}
          where ${bookmarks.resourceId} = ${resources.id}
            and ${bookmarks.userId} = ${authenticatedUserId}
        )`
        : undefined,

      sort === 'top-rated' ? sql`${resources.ratingCount} >= 5` : undefined,
    );

    const orderBy =
      sort === 'alphabetical'
        ? [asc(resources.title), asc(resources.id)]
        : sort === 'most-downloaded'
          ? [
              desc(resources.downloads),
              desc(resources.uploadedAt),
              asc(resources.id),
            ]
          : sort === 'top-rated'
            ? [
                desc(resources.avgRating),
                desc(resources.ratingCount),
                asc(resources.id),
              ]
            : [desc(resources.uploadedAt), asc(resources.id)];

    // NEW: per-user bookmark flag, computed in the same query
    const isBookmarkedSql = authenticatedUserId
      ? sql<boolean>`exists (
        select 1
        from ${bookmarks}
        where ${bookmarks.resourceId} = ${resources.id}
          and ${bookmarks.userId} = ${authenticatedUserId}
      )`
      : sql<boolean>`false`;

    const [rows, totalRows, courseOptions, fileTypeRows] = await Promise.all([
      this.dbService.db
        .select({
          id: resources.id,
          title: resources.title,
          description: resources.description,
          fileUrl: resources.fileUrl,
          fileType: resources.fileType,
          fileSizeMb: resources.fileSizeMb,
          downloads: resources.downloads,
          status: resources.status,
          avgRating: resources.avgRating,
          ratingCount: resources.ratingCount,
          uploadedAt: resources.uploadedAt,
          updatedAt: resources.updatedAt,

          isBookmarked: isBookmarkedSql, // NEW

          creatorId: users.id,
          creatorFirstName: users.firstName,
          creatorMiddleName: users.middleName,
          creatorLastName: users.lastName,
          creatorEmail: users.email,
          creatorProfilePhotoUrl: users.profilePhotoUrl,

          courseId: courses.id,
          courseCode: courses.code,
          courseName: courses.name,
        })
        .from(resources)
        .innerJoin(users, eq(resources.uploadedById, users.id))
        .innerJoin(courses, eq(resources.courseId, courses.id))
        .where(filters)
        .orderBy(...orderBy)
        .limit(limit)
        .offset((page - 1) * limit),

      this.dbService.db
        .select({ total: count() })
        .from(resources)
        .where(filters),

      this.dbService.db
        .selectDistinct({
          id: courses.id,
          code: courses.code,
          name: courses.name,
        })
        .from(resources)
        .innerJoin(courses, eq(resources.courseId, courses.id))
        .where(statusFilter)
        .orderBy(asc(courses.code), asc(courses.name)),

      this.dbService.db
        .selectDistinct({ fileType: resources.fileType })
        .from(resources)
        .orderBy(asc(resources.fileType)),
    ]);

    const data = await Promise.all(rows.map((row) => this.toResourceDto(row)));

    return {
      data,
      courses: courseOptions,
      fileTypes: fileTypeRows.map((row) => row.fileType),
      page,
      limit,
      total: totalRows[0].total,
    };
  }

  async getResource(
    resourceId: string,
    authenticatedUserId?: string,
  ): Promise<ResourceDto> {
    this.validateUuid(resourceId, 'resourceId');

    const isBookmarkedSql = authenticatedUserId
      ? sql<boolean>`exists (
        select 1
        from ${bookmarks}
        where ${bookmarks.resourceId} = ${resources.id}
          and ${bookmarks.userId} = ${authenticatedUserId}
      )`
      : sql<boolean>`false`;

    const [row] = await this.dbService.db
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        fileUrl: resources.fileUrl,
        fileType: resources.fileType,
        fileSizeMb: resources.fileSizeMb,
        downloads: resources.downloads,
        status: resources.status,
        avgRating: resources.avgRating,
        ratingCount: resources.ratingCount,
        isBookmarked: isBookmarkedSql,
        uploadedAt: resources.uploadedAt,
        updatedAt: resources.updatedAt,
        creatorId: users.id,
        creatorFirstName: users.firstName,
        creatorMiddleName: users.middleName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorProfilePhotoUrl: users.profilePhotoUrl,
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
      })
      .from(resources)
      .innerJoin(users, eq(resources.uploadedById, users.id))
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Resource not found');
    }

    return this.toResourceDto(row);
  }

  async downloadResource(resourceId: string): Promise<{
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  }> {
    this.validateUuid(resourceId, 'resourceId');

    const [resource] = await this.dbService.db
      .select({
        fileUrl: resources.fileUrl,
        title: resources.title,
        fileType: resources.fileType,
        status: resources.status,
      })
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const buffer = await this.s3Service.download(resource.fileUrl);

    await this.dbService.db
      .update(resources)
      .set({
        downloads: sql`${resources.downloads} + 1`,
      })
      .where(eq(resources.id, resourceId));

    return {
      fileName: `${resource.title}.${resource.fileType}`,
      mimeType: 'application/octet-stream',
      buffer,
    };
  }

  async getRelatedResources(resourceId: string): Promise<ResourceDto[]> {
    this.validateUuid(resourceId, 'resourceId');

    const [resource] = await this.dbService.db
      .select({ courseId: resources.courseId })
      .from(resources)
      .where(
        and(eq(resources.id, resourceId), eq(resources.status, 'approved')),
      )
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const rows = await this.dbService.db
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        fileUrl: resources.fileUrl,
        fileType: resources.fileType,
        fileSizeMb: resources.fileSizeMb,
        downloads: resources.downloads,
        status: resources.status,
        avgRating: resources.avgRating,
        ratingCount: resources.ratingCount,
        uploadedAt: resources.uploadedAt,
        updatedAt: resources.updatedAt,
        creatorId: users.id,
        creatorFirstName: users.firstName,
        creatorMiddleName: users.middleName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorProfilePhotoUrl: users.profilePhotoUrl,
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
      })
      .from(resources)
      .innerJoin(users, eq(resources.uploadedById, users.id))
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .where(
        and(
          eq(resources.courseId, resource.courseId),
          eq(resources.status, 'approved'),
          sql`${resources.id} <> ${resourceId}`,
        ),
      )
      .orderBy(desc(resources.uploadedAt), asc(resources.id))
      .limit(10);

    return Promise.all(rows.map((row) => this.toResourceDto(row)));
  }

  async createResource(
    body: CreateResourceDto,
    authenticatedUserId: string,
    file?: UploadedResourceFile,
  ): Promise<ResourceDto> {
    this.validateFile(file);

    const title = this.validateText(body?.title, 'title', 255);
    const description = this.validateDescription(body?.description);
    const courseId = body?.courseId;

    this.validateUuid(courseId, 'courseId');

    const [course] = await this.dbService.db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const key = this.createS3Key(authenticatedUserId, file);

    await this.s3Service.upload(key, file.buffer, file.mimetype);

    try {
      const [created] = await this.dbService.db
        .insert(resources)
        .values({
          title,
          description,
          fileUrl: key,
          fileType: this.getFileType(file),
          fileSizeMb: this.getFileSizeMb(file.size),
          uploadedById: authenticatedUserId,
          courseId,
          status: 'pending',
          uploadedAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: resources.id });

      if (!created) {
        throw new Error('Resource insert returned no row');
      }

      // Fetch the complete response with creator and course objects.
      return await this.getResourceForOwner(created.id);
    } catch (error) {
      await this.s3Service.delete(key).catch(() => undefined);
      throw error;
    }
  }

  async bookmarkResource(
    resourceId: string,
    authenticatedUserId: string,
  ): Promise<ResourceBookmarkDto> {
    this.validateUuid(resourceId, 'resourceId');

    const [resource] = await this.dbService.db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(eq(resources.id, resourceId), eq(resources.status, 'approved')),
      )
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const [bookmark] = await this.dbService.db
      .insert(bookmarks)
      .values({
        userId: authenticatedUserId,
        resourceId,
        createdAt: new Date(),
      })
      .onConflictDoNothing()
      .returning({
        userId: bookmarks.userId,
        resourceId: bookmarks.resourceId,
        createdAt: bookmarks.createdAt,
      });

    if (bookmark) {
      return {
        ...bookmark,
        bookmarked: true,
      };
    }

    const [existing] = await this.dbService.db
      .select({
        userId: bookmarks.userId,
        resourceId: bookmarks.resourceId,
        createdAt: bookmarks.createdAt,
      })
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, authenticatedUserId),
          eq(bookmarks.resourceId, resourceId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    return {
      ...existing,
      bookmarked: false,
    };
  }

  async removeBookmark(
    resourceId: string,
    authenticatedUserId: string,
  ): Promise<ResourceBookmarkDto> {
    this.validateUuid(resourceId, 'resourceId');

    const [bookmark] = await this.dbService.db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.resourceId, resourceId),
          eq(bookmarks.userId, authenticatedUserId),
        ),
      )
      .returning({
        userId: bookmarks.userId,
        resourceId: bookmarks.resourceId,
        createdAt: bookmarks.createdAt,
      });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    return {
      ...bookmark,
      bookmarked: false,
    };
  }

  async getResourceRating(
    resourceId: string,
    authenticatedUserId: string,
  ): Promise<ResourceRatingDto | null> {
    this.validateUuid(resourceId, 'resourceId');

    const [rating] = await this.dbService.db
      .select({
        rating: ratings.value,
        resourceId: ratings.resourceId,
        createdAt: ratings.createdAt,
        updatedAt: ratings.updatedAt,
      })
      .from(ratings)
      .where(
        and(
          eq(ratings.resourceId, resourceId),
          eq(ratings.userId, authenticatedUserId),
        ),
      )
      .limit(1);

    return rating ?? null;
  }

  async rateResource(
    resourceId: string,
    authenticatedUserId: string,
    body: ResourceRatingDto,
  ): Promise<ResourceRatingDto> {
    this.validateUuid(resourceId, 'resourceId');

    if (
      !body ||
      typeof body !== 'object' ||
      !Number.isInteger(body.rating) ||
      body.rating < 1 ||
      body.rating > 5
    ) {
      throw new BadRequestException('rating must be an integer from 1 to 5');
    }

    const [resource] = await this.dbService.db
      .select({ id: resources.id })
      .from(resources)
      .where(
        and(eq(resources.id, resourceId), eq(resources.status, 'approved')),
      )
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const now = new Date();

    const [rating] = await this.dbService.db
      .insert(ratings)
      .values({
        userId: authenticatedUserId,
        resourceId,
        value: body.rating,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.resourceId],
        set: {
          value: body.rating,
          updatedAt: now,
        },
      })
      .returning({
        rating: ratings.value,
        resourceId: ratings.resourceId,
        createdAt: ratings.createdAt,
        updatedAt: ratings.updatedAt,
      });

    await this.refreshRatingSummary(resourceId);

    return rating;
  }

  async updateResourceStatus(
    resourceId: string,
    body: UpdateResourceStatusDto,
  ): Promise<ResourceDto> {
    this.validateUuid(resourceId, 'resourceId');

    if (
      !body ||
      typeof body !== 'object' ||
      !['approved', 'rejected'].includes(body.status)
    ) {
      throw new BadRequestException('status must be approved or rejected');
    }

    const [updated] = await this.dbService.db
      .update(resources)
      .set({
        status: body.status,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, resourceId))
      .returning({ id: resources.id });

    if (!updated) {
      throw new NotFoundException('Resource not found');
    }

    return this.getResourceForOwner(updated.id);
  }

  async updateResource(
    resourceId: string,
    authenticatedUserId: string,
    body: UpdateResourceDto,
    file?: UploadedResourceFile,
  ): Promise<ResourceDto> {
    this.validateUuid(resourceId, 'resourceId');

    const [existing] = await this.dbService.db
      .select({
        id: resources.id,
        fileUrl: resources.fileUrl,
        uploadedById: resources.uploadedById,
      })
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Resource not found');
    }

    if (existing.uploadedById !== authenticatedUserId) {
      throw new ForbiddenException('You can only update your own resources');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }

    const allowed = ['title', 'description'];
    if (Object.keys(body).some((key) => !allowed.includes(key))) {
      throw new BadRequestException('Unsupported resource update field');
    }

    if (Object.keys(body).length === 0 && !file) {
      throw new BadRequestException(
        'Supply at least one field or a replacement file',
      );
    }

    const update: {
      title?: string;
      description?: string | null;
      fileUrl?: string;
      fileType?: string;
      fileSizeMb?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if ('title' in body) {
      update.title = this.validateText(body.title, 'title', 255);
    }

    if ('description' in body) {
      update.description = this.validateDescription(body.description);
    }

    let newKey: string | undefined;

    if (file) {
      this.validateFile(file);
      newKey = this.createS3Key(authenticatedUserId, file);

      await this.s3Service.upload(newKey, file.buffer, file.mimetype);

      update.fileUrl = newKey;
      update.fileType = this.getFileType(file);
      update.fileSizeMb = this.getFileSizeMb(file.size);
    }

    try {
      const [updated] = await this.dbService.db
        .update(resources)
        .set(update)
        .where(eq(resources.id, resourceId))
        .returning({ id: resources.id });

      if (!updated) {
        throw new NotFoundException('Resource not found');
      }
    } catch (error) {
      if (newKey) {
        await this.s3Service.delete(newKey).catch(() => undefined);
      }
      throw error;
    }

    if (newKey) {
      // Remove the old object only after the database points to the new one.
      await this.s3Service.delete(existing.fileUrl);
    }

    return this.getResourceForOwner(resourceId);
  }

  async deleteResource(
    resourceId: string,
    authenticatedUserId: string,
  ): Promise<{ message: string }> {
    this.validateUuid(resourceId, 'resourceId');

    const [requestingUser] = await this.dbService.db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, authenticatedUserId))
      .limit(1);

    if (!requestingUser) {
      throw new NotFoundException('Authenticated user not found');
    }

    const [resource] = await this.dbService.db
      .select({
        id: resources.id,
        fileUrl: resources.fileUrl,
        uploadedById: resources.uploadedById,
      })
      .from(resources)
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    if (
      requestingUser.role !== 'admin' &&
      resource.uploadedById !== authenticatedUserId
    ) {
      throw new ForbiddenException('You can only delete your own resources');
    }

    // Remove dependent rows first because the schema has no ON DELETE CASCADE.
    await this.dbService.db.transaction(async (tx) => {
      await tx.delete(reports).where(eq(reports.resourceId, resourceId));
      await tx.delete(bookmarks).where(eq(bookmarks.resourceId, resourceId));
      await tx.delete(ratings).where(eq(ratings.resourceId, resourceId));
      await tx.delete(resources).where(eq(resources.id, resourceId));
    });

    await this.s3Service.delete(resource.fileUrl);

    return { message: 'Resource deleted successfully' };
  }

  private async getResourceForOwner(resourceId: string): Promise<ResourceDto> {
    const [row] = await this.dbService.db
      .select({
        id: resources.id,
        title: resources.title,
        description: resources.description,
        fileUrl: resources.fileUrl,
        fileType: resources.fileType,
        fileSizeMb: resources.fileSizeMb,
        downloads: resources.downloads,
        status: resources.status,
        avgRating: resources.avgRating,
        ratingCount: resources.ratingCount,
        uploadedAt: resources.uploadedAt,
        updatedAt: resources.updatedAt,
        creatorId: users.id,
        creatorFirstName: users.firstName,
        creatorMiddleName: users.middleName,
        creatorLastName: users.lastName,
        creatorEmail: users.email,
        creatorProfilePhotoUrl: users.profilePhotoUrl,
        courseId: courses.id,
        courseCode: courses.code,
        courseName: courses.name,
      })
      .from(resources)
      .innerJoin(users, eq(resources.uploadedById, users.id))
      .innerJoin(courses, eq(resources.courseId, courses.id))
      .where(eq(resources.id, resourceId))
      .limit(1);

    if (!row) {
      throw new NotFoundException('Resource not found');
    }

    return this.toResourceDto(row);
  }

  private async refreshRatingSummary(resourceId: string): Promise<void> {
    const [summary] = await this.dbService.db
      .select({
        average: sql<string>`coalesce(avg(${ratings.value})::numeric(3,2), 0)::text`,
        total: count(),
      })
      .from(ratings)
      .where(eq(ratings.resourceId, resourceId));

    await this.dbService.db
      .update(resources)
      .set({
        avgRating: summary.average,
        ratingCount: summary.total,
        updatedAt: new Date(),
      })
      .where(eq(resources.id, resourceId));
  }

  private async toResourceDto(row: {
    id: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileType: string;
    fileSizeMb: string | null;
    downloads: number;
    status: string;
    avgRating: string;
    ratingCount: number;
    isBookmarked?: boolean;
    uploadedAt: Date;
    updatedAt: Date;
    creatorId: string;
    creatorFirstName: string;
    creatorMiddleName: string | null;
    creatorLastName: string;
    creatorEmail: string;
    creatorProfilePhotoUrl: string | null;
    courseId: string;
    courseCode: string;
    courseName: string;
  }): Promise<ResourceDto> {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      fileUrl: await this.s3Service.getPresignedUrl(row.fileUrl),
      fileType: row.fileType,
      fileSizeMb: row.fileSizeMb,
      downloads: row.downloads,
      status: row.status,
      avgRating: row.avgRating,
      ratingCount: row.ratingCount,
      isBookmarked: row.isBookmarked ?? false,
      creator: {
        id: row.creatorId,
        firstName: row.creatorFirstName,
        middleName: row.creatorMiddleName,
        lastName: row.creatorLastName,
        email: row.creatorEmail,
        profilePhotoUrl: row.creatorProfilePhotoUrl
          ? await this.s3Service.getPresignedUrl(row.creatorProfilePhotoUrl)
          : null,
      },
      course: {
        id: row.courseId,
        code: row.courseCode,
        name: row.courseName,
      },
      uploadedAt: row.uploadedAt,
      updatedAt: row.updatedAt,
    };
  }

  private createS3Key(userId: string, file: UploadedResourceFile): string {
    const extension = file.originalname.split('.').pop()?.toLowerCase();
    const safeExtension =
      extension && /^[a-z0-9]{1,10}$/.test(extension) ? extension : 'bin';

    return `resources/${userId}/${crypto.randomUUID()}.${safeExtension}`;
  }

  private getFileType(file: UploadedResourceFile): string {
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (!extension || !/^[a-z0-9]{1,50}$/.test(extension)) {
      throw new BadRequestException('File must have a valid extension');
    }

    return extension;
  }

  private getFileSizeMb(size: number): string {
    return (size / (1024 * 1024)).toFixed(2);
  }

  private validateFile(
    file?: UploadedResourceFile,
  ): asserts file is UploadedResourceFile {
    if (
      !file ||
      !file.buffer ||
      !Buffer.isBuffer(file.buffer) ||
      !file.originalname ||
      !file.mimetype ||
      !Number.isSafeInteger(file.size) ||
      file.size <= 0
    ) {
      throw new BadRequestException('A valid file is required');
    }

    if (file.buffer.length !== file.size) {
      throw new BadRequestException('Invalid uploaded file');
    }
  }

  private validateDescription(value: unknown): string | null {
    if (value === undefined || value === null) {
      return value === undefined ? null : null;
    }

    if (typeof value !== 'string' || value.length > 10000) {
      throw new BadRequestException(
        'description must be a string of at most 10000 characters or null',
      );
    }

    return value;
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
    if (value === undefined) {
      return fallback;
    }

    const parsed =
      typeof value === 'number'
        ? value
        : typeof value === 'string' && /^\d+$/.test(value)
          ? Number(value)
          : NaN;

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
