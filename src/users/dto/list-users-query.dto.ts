import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search user name or email' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: ['ADMIN', 'STUDENT'],
  })
  role?: 'ADMIN' | 'STUDENT';

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['ACTIVE', 'DISABLED'],
  })
  status?: 'ACTIVE' | 'DISABLED';

  @ApiPropertyOptional({
    enum: ['alphabetical', 'newest', 'oldest'],
    default: 'newest',
  })
  sort?: string;

  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  page?: string;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  limit?: string;
}
