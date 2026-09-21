import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { AuthService } from '../auth/auth.service';
import { DbService } from '../db/db.service';
import { S3Service } from '../s3/s3.service';

import { users } from '../db/schema';

import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UserDto } from './dto/user.dto';
import { PaginatedUsersDto } from './dto/paginated-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly dbService: DbService,
    private readonly authService: AuthService,
    private readonly s3Service: S3Service,
  ) {}

  async listUsers(query: ListUsersQueryDto): Promise<PaginatedUsersDto> {
    const page = this.parsePositiveInteger(query.page, 1, 'page');
    const limit = this.parsePositiveInteger(query.limit, 20, 'limit');
    if (limit > 100) {
      throw new BadRequestException('limit must be at most 100');
    }
    if (!Number.isSafeInteger((page - 1) * limit)) {
      throw new BadRequestException('page is too large');
    }

    const sort = this.parseString(query.sort, 'sort') ?? 'newest';
    if (!['alphabetical', 'newest', 'oldest'].includes(sort)) {
      throw new BadRequestException(
        'sort must be alphabetical, newest, or oldest',
      );
    }

    const search = this.parseString(query.search, 'search')?.trim();
    const role = this.parseString(query.role, 'role');
    if (role !== undefined && role !== 'admin' && role !== 'student') {
      throw new BadRequestException('role must be admin or student');
    }
    const status = this.parseString(query.status, 'status');
    if (
      status !== undefined &&
      status !== 'pending' &&
      status !== 'active' &&
      status !== 'inactive'
    ) {
      throw new BadRequestException(
        'status must be pending, active, or inactive',
      );
    }
    const name = sql<string>`concat_ws(' ', ${users.firstName}, ${users.middleName}, ${users.lastName})`;
    const filters = and(
      search
        ? or(ilike(name, `%${search}%`), ilike(users.email, `%${search}%`))
        : undefined,
      role ? eq(users.role, role) : undefined,
      status ? eq(users.status, status) : undefined,
    );

    const orderBy =
      sort === 'alphabetical'
        ? [asc(users.firstName), asc(users.lastName), asc(users.id)]
        : sort === 'oldest'
          ? [asc(users.joinedAt), asc(users.id)]
          : [desc(users.joinedAt), asc(users.id)];

    const [data, totalRows] = await Promise.all([
      this.dbService.db
        .select({
          id: users.id,
          firstName: users.firstName,
          middleName: users.middleName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          status: users.status,
          profilePhotoUrl: users.profilePhotoUrl,
          joinedAt: users.joinedAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(filters)
        .orderBy(...orderBy)
        .limit(limit)
        .offset((page - 1) * limit),
      this.dbService.db.select({ total: count() }).from(users).where(filters),
    ]);

    return { data, page, limit, total: totalRows[0].total };
  }

  async getUser(userId: string): Promise<UserDto> {
    const [user] = await this.dbService.db
      .select({
        id: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        status: users.status,
        profilePhotoUrl: users.profilePhotoUrl,
        joinedAt: users.joinedAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(
    userId: string,
    authenticatedUserId: string,
    body: UpdateUserDto,
    profilePhoto?: {
      originalname: string;
      buffer: Buffer;
      mimetype: string;
    },
  ): Promise<UserDto> {
    const [requestingUser] = await this.dbService.db
      .select({
        id: users.id,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, authenticatedUserId))
      .limit(1);

    if (!requestingUser) {
      throw new NotFoundException('Authenticated user not found');
    }

    if (requestingUser.role !== 'admin' && requestingUser.id !== userId) {
      throw new ForbiddenException('You can only update your own profile');
    }

    const [existingUser] = await this.dbService.db
      .select({
        profilePhotoUrl: users.profilePhotoUrl,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const allowed = ['firstName', 'middleName', 'lastName'];

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }

    const keys = Object.keys(body);

    if (keys.length === 0 && !profilePhoto) {
      throw new BadRequestException(
        'Supply at least one profile field or profile photo',
      );
    }

    if (keys.some((key) => !allowed.includes(key))) {
      throw new BadRequestException('Supply only supported profile fields');
    }

    const update: {
      firstName?: string;
      middleName?: string | null;
      lastName?: string;
      profilePhotoUrl?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if ('firstName' in body) {
      update.firstName = this.validateText(body.firstName, 'firstName', 100);
    }

    if ('middleName' in body) {
      update.middleName = this.validateText(
        body.middleName,
        'middleName',
        100,
        true,
      );
    }

    if ('lastName' in body) {
      update.lastName = this.validateText(body.lastName, 'lastName', 100);
    }

    if (profilePhoto) {
      if (!profilePhoto.mimetype.startsWith('image/')) {
        throw new BadRequestException('Profile photo must be an image');
      }

      const key =
        `profiles/${userId}/` + `${Date.now()}-${profilePhoto.originalname}`;

      await this.s3Service.upload(
        key,
        profilePhoto.buffer,
        profilePhoto.mimetype,
      );

      if (existingUser.profilePhotoUrl) {
        await this.s3Service.delete(existingUser.profilePhotoUrl);
      }

      update.profilePhotoUrl = key;
    }

    const [user] = await this.dbService.db
      .update(users)
      .set(update)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        status: users.status,
        profilePhotoUrl: users.profilePhotoUrl,
        joinedAt: users.joinedAt,
        updatedAt: users.updatedAt,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changeUserRole(
    userId: string,
    body: ChangeUserRoleDto,
  ): Promise<UserDto> {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      (body.role !== 'admin' && body.role !== 'student')
    ) {
      throw new BadRequestException(
        'Body must contain only role: admin or student',
      );
    }

    const [user] = await this.dbService.db
      .update(users)
      .set({ role: body.role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        status: users.status,
        profilePhotoUrl: users.profilePhotoUrl,
        joinedAt: users.joinedAt,
        updatedAt: users.updatedAt,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changeUserStatus(
    userId: string,
    body: ChangeUserStatusDto,
  ): Promise<UserDto> {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      (body.status !== 'active' && body.status !== 'inactive')
    ) {
      throw new BadRequestException(
        'Body must contain only status: active or inactive',
      );
    }

    const [user] = await this.dbService.db
      .update(users)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        firstName: users.firstName,
        middleName: users.middleName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        status: users.status,
        profilePhotoUrl: users.profilePhotoUrl,
        joinedAt: users.joinedAt,
        updatedAt: users.updatedAt,
      });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async changePassword(
    userId: string,
    authenticatedUserId: string,
    accessToken: string,
    oldPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    if (userId !== authenticatedUserId) {
      throw new ForbiddenException('Only you can change your own password');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirmation password do not match',
      );
    }

    return this.authService.changePassword(
      accessToken,
      oldPassword,
      newPassword,
    );
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
    if (nullable && value === null) return null;
    if (
      typeof value !== 'string' ||
      !value.trim() ||
      value.length > maxLength
    ) {
      throw new BadRequestException(
        `${name} must be a nonempty string of at most ${maxLength} characters${nullable ? ' or null' : ''}`,
      );
    }
    return value;
  }
}
