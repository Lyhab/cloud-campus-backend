import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Search by user name or email',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by role',
    enum: ['admin', 'student'],
    example: 'student',
  })
  @IsOptional()
  @IsIn(['admin', 'student'])
  role?: 'admin' | 'student';

  @ApiPropertyOptional({
    description: 'Filter by status',
    enum: ['pending', 'active', 'inactive'],
    example: 'active',
  })
  @IsOptional()
  @IsIn(['pending', 'active', 'inactive'])
  status?: 'pending' | 'active' | 'inactive';

  @ApiPropertyOptional({
    description: 'Sort users',
    enum: ['alphabetical', 'newest', 'oldest'],
    default: 'newest',
    example: 'newest',
  })
  @IsOptional()
  @IsIn(['alphabetical', 'newest', 'oldest'])
  sort?: 'alphabetical' | 'newest' | 'oldest';

  @ApiPropertyOptional({
    description: 'Page number',
    type: Number,
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of users per page',
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
