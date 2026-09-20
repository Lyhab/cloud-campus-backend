import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { DbService } from '../db/db.service';
import { users } from '../db/schema';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { ChangeUserStatusDto } from './dto/change-user-status.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PaginatedUsersDto, UserDto } from './dto/paginated-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService) {}

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
    if (role !== undefined && role !== 'ADMIN' && role !== 'STUDENT') {
      throw new BadRequestException('role must be ADMIN or STUDENT');
    }
    const status = this.parseString(query.status, 'status');
    if (status !== undefined && status !== 'ACTIVE' && status !== 'DISABLED') {
      throw new BadRequestException('status must be ACTIVE or DISABLED');
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

  async updateUser(userId: string, body: UpdateUserDto): Promise<UserDto> {
    const allowed = ['firstName', 'middleName', 'lastName', 'profilePhotoUrl'];
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Body must be an object');
    }
    const keys = Object.keys(body);
    if (keys.length === 0 || keys.some((key) => !allowed.includes(key))) {
      throw new BadRequestException(
        'Supply at least one supported profile field',
      );
    }

    const update: UpdateUserDto & { updatedAt: Date } = {
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
    if ('profilePhotoUrl' in body) {
      update.profilePhotoUrl = this.validateText(
        body.profilePhotoUrl,
        'profilePhotoUrl',
        500,
        true,
      );
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

  async changeUserRole(
    userId: string,
    body: ChangeUserRoleDto,
  ): Promise<UserDto> {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).length !== 1 ||
      (body.role !== 'ADMIN' && body.role !== 'STUDENT')
    ) {
      throw new BadRequestException(
        'Body must contain only role: ADMIN or STUDENT',
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
      (body.status !== 'ACTIVE' && body.status !== 'DISABLED')
    ) {
      throw new BadRequestException(
        'Body must contain only status: ACTIVE or DISABLED',
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
}
