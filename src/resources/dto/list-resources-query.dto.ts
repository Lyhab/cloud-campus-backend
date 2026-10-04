import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListResourcesQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (default 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Page size (default 20, max 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    enum: ['alphabetical', 'newest', 'most-downloaded', 'top-rated'],
    example: 'newest',
    description: 'Sort order (default newest)',
  })
  @IsOptional()
  @IsIn(['alphabetical', 'newest', 'most-downloaded', 'top-rated'])
  sort?: 'alphabetical' | 'newest' | 'most-downloaded' | 'top-rated';

  @ApiPropertyOptional({
    example: 'algorithms',
    description: 'Search resource title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Filter by course ID',
  })
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @ApiPropertyOptional({
    example: 'pdf',
    description: 'Filter by file type',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({
    enum: ['all', 'bookmarked', 'my-uploads'],
    example: 'all',
    description:
      'Filter resources by all, bookmarked, or uploaded by the caller',
  })
  @IsOptional()
  @IsIn(['all', 'bookmarked', 'my-uploads'])
  filter?: 'all' | 'bookmarked' | 'my-uploads';

  @ApiPropertyOptional({
    enum: ['all', 'pending', 'approved', 'rejected'],
    example: 'all',
    default: 'all',
    description: 'Filter resources by approval status',
  })
  @IsOptional()
  @IsIn(['all', 'pending', 'approved', 'rejected'])
  status?: 'all' | 'pending' | 'approved' | 'rejected';
}
