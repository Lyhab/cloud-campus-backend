import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name or email',
    example: 'john',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: ['admin', 'student'],
    example: 'student',
  })
  role?: 'admin' | 'student';

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['pending', 'active', 'inactive'],
    example: 'active',
  })
  status?: 'pending' | 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Sort users',
    enum: ['alphabetical', 'newest', 'oldest'],
    default: 'newest',
    example: 'newest',
  })
  sort?: 'alphabetical' | 'newest' | 'oldest';

  @ApiPropertyOptional({
    description: 'Page number',
    type: Number,
    default: 1,
    minimum: 1,
    example: 1,
  })
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of users per page',
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  limit?: string;
}
